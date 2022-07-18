const Controller = require('./controller');
const https = require('https');
const fs = require('fs');
const url = require('url');

const controller = new Controller();
const prefix = '/api';
const options = {
    key : fs.readFileSync('pem/private_key.pem'),
    cert : fs.readFileSync('pem/cacert.pem')
};
const server = https.createServer(options);

server.on('request', async (req, res) => {
    console.log('request', req.url, req.method);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    if (req.method === 'OPTIONS') {
        res.status = 200;
        res.end();
        return;
    }

    if (req.url.indexOf('/fileChunk/presence') !== -1) {
        console.log(req.url);
        await controller.handleVerifyUpload(req, res);
        return;
    }

    if (req.url === `${prefix}/fileChunk/merge`) {
        await controller.handleMerge(req, res);
        return;
    }

    if (req.url === `${prefix}/fileChunk`) {
        await controller.handleFileChunk(req, res);
    }
    if (req.url === `${prefix}/`) {
        var data = url.parse(req.url, true);
        console.log('Welcome', data.query);
        res.end('Welcome');
    }
});

server.listen(3000, () => console.log('正在监听 3000 端口'));