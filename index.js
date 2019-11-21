const http = require('http');
const urlParser = require('url').parse;
const spawn = require('child_process').spawn;
const tempDir = require('os').tmpdir();
const fileSystem = require('fs');

const server = http.createServer((request, response) => {
    const requestPath = urlParser(request.url).pathname;

    if (requestPath === '/health') {
        return healthCheck(request, response);
    }

    generatePdf(request, response);
}).listen(8000);

const healthCheck = (request, response) => {
    response.writeHead(200, {
        'Content-Type': 'text/plain',
        'X-Powered-By': 'html2pdf'
    });
    response.end('ok');
};

const log = (level, jsonMessage) => {
    console.log(JSON.stringify(
        Object.assign(
            {'level': level},
            jsonMessage
        )
    ));
}

const generatePdf = (request, response) => {
    const requestBodyStream = [];
    const clientId = (Math.random() * 0x100000000 + 1).toString(36);

    log('info', {
        'timestamp': (new Date).toISOString(),
        'client': clientId,
        'module': 'request',
        'message': 'Connected',
    });

    request.on('data', (chunk) => {
        requestBodyStream.push(chunk);
    });

    request.on('end', () => {
        const requestBody = Buffer.concat(requestBodyStream).toString();

        log('debug', {
            'timestamp': (new Date).toISOString(),
            'client': clientId,
            'module': 'request',
            'message': 'Received a payload of ' + Buffer.byteLength(requestBody, 'utf8') + ' bytes',
        });

        const tempFile = tempDir + '/' + clientId + '.pdf';
        const wkhtmltopdf = spawn('wkhtmltopdf', [
            '--quiet',
            '--print-media-type',
            '--no-outline',
            '-',
            tempFile,
        ]);

        wkhtmltopdf.stdin.end(requestBody);

        wkhtmltopdf.on('exit', (code) => {
            log('info', {
                'timestamp': (new Date).toISOString(),
                'client': clientId,
                'module': 'wkhtmltopdf',
                'message': 'Exitted with code ' + code,
            });

            if (code !== 0) {
                response.writeHead(500);
                response.end();
                return;
            }

            const tempFileSize = fileSystem.statSync(tempFile).size;
            const readStream = fileSystem.createReadStream(tempFile);

            log('debug', {
                'timestamp': (new Date).toISOString(),
                'client': clientId,
                'module': 'wkhtmltopdf',
                'message': 'Generated a PDF of ' + tempFileSize + ' bytes at ' + tempFile,
            });

            readStream.on('close', () => {
                fileSystem.unlinkSync(tempFile);

                log('debug', {
                    'timestamp': (new Date).toISOString(),
                    'client': clientId,
                    'module': 'request',
                    'message': 'Removed temporary file ' + tempFile,
                });
            });

            response.writeHead(200);
            readStream.pipe(response);
        });

        wkhtmltopdf.stderr.on('data', (chunk) => {
            log('warn', {
                'timestamp': (new Date).toISOString(),
                'client': clientId,
                'module': 'wkhtmltopdf',
                'message': chunk.toString(),
            });
        });
    });

    request.on('error', (error) => {
        log('warn', {
            'timestamp': (new Date).toISOString(),
            'client': clientId,
            'module': 'request',
            'message': error,
        });

        response.writeHead(400);
        response.end();
    });
};
