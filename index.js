const http = require('http');
const wkhtmltopdf = require('wkhtmltopdf');

http.createServer((req, res) => {
    let body = [];
    req.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        wkhtmltopdf(body).pipe(res);
        res.writeHead(200);
    });
}).listen(8000);
