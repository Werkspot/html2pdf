const http = require('http');
const urlParser = require('url').parse;
const spawn = require('child_process').spawn;
const tempDir = require('os').tmpdir();
const fileSystem = require('fs');
const path = require('path');

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

const writeTempFile = (fileName, content) => {
    return new Promise((resolve, reject) => {
        const tempFile = path.join(tempDir, fileName);
        fileSystem.writeFile(tempFile, content, 'utf8', (error) => {
            if (error) {
                return reject(error);
            }
            resolve(tempFile);
        });
    });
}

const createTempHeader = (clientId, content) => {
    return writeTempFile(clientId + 'header.html', content);
}

const createTempFooter = (clientId, content) => {
    return writeTempFile(clientId + 'footer.html', content);
}

const parseBody = (requestBody) => {
    try {
        const request = JSON.parse(requestBody);
        return {
            header: request.header || '',
            body: request.body || '',
            footer: request.footer || '',
        };
    } catch (error) {
        // notice: fallback to only body generation
        return {
            header: '',
            footer: '',
            body: requestBody,
        };
    }
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
        const params = ['--quiet', '--print-media-type', '--no-outline', '-'];

        const { header, body, footer } = parseBody(requestBody);
        const promises = [];

        promises.push(
            !!header
                ? createTempHeader(clientId, header)
                : Promise.resolve('')
        );

        promises.push(
            !!footer
                ? createTempFooter(clientId, footer)
                : Promise.resolve('')
        );

        Promise.all(promises).then((data) => {
            const headerTempFile = data[0];
            const footerTempFile = data[1];

          if (!!headerTempFile) {
              params.push('--header-html');
              params.push(headerTempFile);
          }

          if (!!footerTempFile) {
              params.push('--footer-html');
              params.push(footerTempFile);
          }

          log('debug', {
              'timestamp': (new Date).toISOString(),
              'client': clientId,
              'module': 'request',
              'message': 'Received a payload of ' + Buffer.byteLength(requestBody, 'utf8') + ' bytes',
          });

          const tempFile = tempDir + '/' + clientId + '.pdf';
          params.push(tempFile);

          const wkhtmltopdf = spawn('wkhtmltopdf', params);

          wkhtmltopdf.stdin.end(body);

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
                  const tempFiles = [tempFile];
                  fileSystem.unlinkSync(tempFile);
                  if (headerTempFile) {
                      fileSystem.unlinkSync(headerTempFile);
                      tempFiles.push(headerTempFile);
                  }
                  if (footerTempFile) {
                      fileSystem.unlinkSync(footerTempFile);
                      tempFiles.push(footerTempFile);
                  }

                  log('debug', {
                      'timestamp': (new Date).toISOString(),
                      'client': clientId,
                      'module': 'request',
                      'message': 'Removed temporary files: ' + tempFiles.join(", "),
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
        }).catch((error) => {
          log('warn', {
              'timestamp': (new Date).toISOString(),
              'client': clientId,
              'module': 'promises',
              'message': error,
          });

          response.writeHead(400);
          response.end();
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
