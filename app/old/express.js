'use strict';
var path = require('path'),
    fs = require('fs'),
    config = require(path.join(__dirname, '../config.json')),
    db = require(path.join(__dirname, 'core/database.js')),
    expressCore = require(path.join(__dirname, 'core/express-core.js')),
    app = expressCore.app,
    express = expressCore.express,
    jade = require('jade'),
    dictionary = {};
var crypto = require('crypto');
function openLisen() {
    function indexRes(res, lang) {
        let option = {
            lang: dictionary[lang],
            domain: config.domain,
            product: config.product
        };
        res.setHeader('charset', 'utf-8');
        res.header('Content-Type', 'text/html');
        res.end(jade.renderFile(path.join(__dirname, '../template/index.jade'), option));

    }


    var files = fs.readdirSync(path.join(__dirname, '../lang'));
    files.filter(function (el, i) {
        let src = el.split('.');
        var nameLang = src[0];
        dictionary[nameLang] = require(path.join(__dirname, '../lang/' + nameLang), 'dont-enclose');
        dictionary[nameLang].nameLang = nameLang;
        app.get(['/' + nameLang + '/', '/' + nameLang + '/index*'], function (req, res) {
            indexRes(res, nameLang);
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            console.log('Новый  клиент: '+ip);
        });
    });
    app.use('/src', express.static(path.join(__dirname, '../src')));
    app.use('/lang', express.static(path.join(__dirname, '../lang')));
    app.get(['/', '/index.*'], function (req, res, next) {
        res.writeHead(302, {"Location": config.defaultLang + req.url});
        res.end();
    });
    app.get('/GetPayInfo/:type/:version/:domain', function (req, res, next) {
        res.setHeader('charset', 'utf-8');
        res.header('Content-Type', 'text/plain');
        switch (req.params.type) {
            case 'card':
                var hesh, str;
                switch (req.params.version) {
                    case 'buy':
                        str = {
                            success: true,
                            merchantAccount: "obmen_box_com",
                            merchantDomainName: "obmen-box.com",
                            authorizationType: "SimpleSignature",
                            orderReference: "EX" + new Date().getTime(),
                            orderDate: (new Date().getTime() / 1000).toFixed(0),
                            amount: config.product.buy.toFixed(2),
                            currency: "USD",
                            productName: "Obmen-BOX " + config.product.version + " " + req.params.domain,
                            productPrice: config.product.buy.toFixed(0),
                            productCount: "1",
                            theme: "bindcard",
                            clientFirstName: "Богдан",
                            clientLastName: "Медведев",
                            clientEmail: "support@obmen-box.com",
                            clientPhone: "380994775357"
                        };

                        hesh = str.merchantAccount + ';' +
                            str.merchantDomainName + ';' +
                            str.orderReference + ';' +
                            str.orderDate + ';' +
                            str.amount + ';' +
                            str.currency + ';' +
                            str.productName + ';' +
                            str.productCount + ';' +
                            str.productPrice;
                        str.hesh = hesh;
                        str.merchantSignature = crypto.createHmac("md5", "be98a287a809d54830aaa28540d6444c016504ee").update(str.merchantAccount + ';' +
                            str.merchantDomainName + ';' +
                            str.orderReference + ';' +
                            str.orderDate + ';' +
                            str.amount + ';' +
                            str.currency + ';' +
                            str.productName + ';' +
                            str.productCount + ';' +
                            str.productPrice).digest("hex");
                        res.end(JSON.stringify(str));
                        break;
                    case 'rent':
                        str = {
                            success: true,
                            merchantAccount: "obmen_box_com",
                            merchantDomainName: "obmen-box.com",
                            authorizationType: "SimpleSignature",
                            orderReference: "EX" + (new Date().getTime() / 10).toFixed(0),
                            orderDate: (new Date().getTime() / 1000).toFixed(0),
                            amount: config.product.rent.toFixed(2),
                            currency: "USD",
                            productName: "Обменник Obmen-BOX " + config.product.version + " " + req.params.domain,
                            productPrice: config.product.rent.toFixed(0),
                            productCount: "1",
                            theme: "bindcard",
                            clientFirstName: "Богдан",
                            clientLastName: "Медведев",
                            clientEmail: "support@obmen-box.com",
                            clientPhone: "380994775357"
                        };

                        hesh = str.merchantAccount + ';' +
                            str.merchantDomainName + ';' +
                            str.orderReference + ';' +
                            str.orderDate + ';' +
                            str.amount + ';' +
                            str.currency + ';' +
                            str.productName + ';' +
                            str.productCount + ';' +
                            str.productPrice;
                        str.merchantSignature = crypto.createHmac("md5", "be98a287a809d54830aaa28540d6444c016504ee").update(hesh).digest("hex");
                        res.end(JSON.stringify(str));
                        break;
                    default:
                        res.end('{"success":false}');
                        break;

                }
                break;
            case 'free':
                res.end('{"success":true,"login":"123","pass":"123"}');
                break;
            default:
                res.end('{"success":false}');
                break;
        }
    });
    app.use('/', express.static(path.join(__dirname, '../www')));
}
module.exports.openLisen = openLisen;