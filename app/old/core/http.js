'use strict';
var http,
    ssl = false,
    path = require('path'),
    config = require(path.join(__dirname, '../../config.json')),
    db = require(path.join(__dirname, 'database.js')),
    query = db.query,
    express = require(path.join(__dirname, 'express-core.js')),
    app = express.app;

function createHTTPServer(callback) {
    query("SELECT name,value FROM setting", (rows)=> {
        var setting = {};
        rows.forEach((el)=> {
            setting[el.name] = el.value;
        });
        this.initServer(setting, callback);
    });
    query("SET GLOBAL event_scheduler = On;", ()=> {
        query("SHOW VARIABLES LIKE 'event_scheduler';", (rows)=> {
            if (rows[0].Value != 'ON') {
                console.error('Ошибка создание собитий автоудаление заявок: ' + rows[0].Value);
            }
        });
    });
}
function initServer(setting, callback) {
    if (setting.ssl == 1) {
        ssl = true;
        var ssl_Certificate = {
            //key: setting.ssl_key,
            //cert: setting.ssl_cert,
            //ca: setting.ssl_ca
        };
        this.openHTTPS_S_Server(ssl_Certificate, setting.port, callback);
    } else {
        this.openHTTP_Server(setting.port, callback);
    }
}
function openHTTPS_S_Server(sslOption, port, callback) {
    var PORT = port.split(',');
    require('http').createServer(function (req, res) {
        res.writeHead(302, {"Location": "https://" + req.headers['host'] + req.url});
        res.end();
    }).listen(PORT[0]);
    http = require('https').createServer(sslOption, app).listen(PORT[1]);
    console.log('Запущен  HTTP(S) Сервер: https://' + config.domain + '/');
    exports.http = http;
    exports.ssl = ssl;
    if (callback) {
        callback();
    }

}
function openHTTP_Server(port, callback) {
    var PORT = port.split(',');
    http = require('http').createServer(app).listen(PORT[0]);
    console.log('Запущен  HTTP Сервер: http://' + config.domain + '/');
    exports.http = http;
    exports.ssl = ssl;
    if (callback) {
        callback();
    }

}
function rebootServer() {
    console.log('HTTP(S) Сервер остановлен!');
    http.close();
    this.createHTTPServer();
}
module.exports.http = http;
module.exports.ssl = ssl;
module.exports.createHTTPServer = createHTTPServer;
module.exports.initServer = initServer;
module.exports.openHTTPS_S_Server = openHTTPS_S_Server;
module.exports.openHTTP_Server = openHTTP_Server;
module.exports.rebootServer = rebootServer;

