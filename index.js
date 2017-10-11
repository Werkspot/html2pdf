const http = require('http');
const wkhtmltopdf = require('wkhtmltopdf');
const options = {
    'printMediaType': true,
    'noOutline': true,
};

http.createServer((req, res) => {
    let body = [];
    req.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        wkhtmltopdf(body, options).pipe(res);
        res.writeHead(200);
    });
}).listen(8000);
