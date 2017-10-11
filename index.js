const http = require('http');
const wkhtmltopdf = require('wkhtmltopdf');
const options = {
    'printMediaType': true,
    'noOutline': true,
};
const server = http.createServer((req, res) => {
    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();

        wkhtmltopdf(body, options, (err, stream) => {
            if (err) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200);
                stream.pipe(res);
            }
        });
    });
});

server.on('clientError', (err) => {
    console.error(err);
}).listen(8000);
