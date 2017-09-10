'use strict';
var http = require('http');
var xml2js = require('xml2js');
var parserXML = new xml2js.Parser().parseString;
var auth = {login: '380994775357', pass: '9216009Bbb', name: 'obmen-Bot'};


function send(tel, message, callback) {
    var formData = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<request>' +
        '<auth>' +
        '<login>' + auth.login + '</login>' +
        '<password>' + auth.pass + '</password>' +
        '</auth>' +
        '<message> ' +
        '<from>' + auth.name + '</from> ' +
        '<text>' + message + '</text>' +
        '<recipient>' + tel + '</recipient>' +
        '</message>' +
        '</request>';
    var postRequest = {
        host: "letsads.com",
        path: "/api",
        port: 80,
        method: "POST",
        headers: {
            'Cookie': "cookie",
            'Content-Type': 'text/xml',
            'Content-Length': Buffer.byteLength(formData)
        }
    };
    var buffer = "";
    var req = http.request(postRequest, function (res) {
        var buffer = "";
        res.on("data", function (data) {
            buffer = buffer + data;
        });
        res.on("end", function () {
            parserXML(buffer, function (err, result) {
                if (err) callback && callback(err, null);
                else {
                    if (result.response.name[0] == 'Error') {
                        callback && callback({
                            type: 'sms-api',
                            docs: 'https://letsads.com/sms-api',
                            codeError: result.response.description[0]
                        }, null);
                    } else {
                        callback && callback(null, result.response.sms_id[0]);
                    }
                }
            });
        });
    });
    req.on('error', function (e) {
        callback && callback(e, null);});
    req.write(formData);
    req.end();
}
module.exports.send = send;