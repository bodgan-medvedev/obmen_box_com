'use strict';
var io = require('socket.io')(8080);
var sms = require('./sms.js');
var telegram = require('./telegram.js');
var skype = require('./skype.js');

var db = require('./core/db.js');
var query = db.query;

function getBalance(serverID, callback) {
    query("SELECT * FROM servers WHERE ?", {id: serverID}, (result)=> {
        if (result.length == 1)
            callback && callback({balance: result[0].balance, type: "USD"});
    });
}
function setBalance(serverID, amount) {
    query("UPDATE servers SET balance=(balance+?) WHERE ?", [parseFloat(amount), {id: serverID}]);
}
io.on('connection', function (socket) {
    io.emit('this', {test: 'be received by everyone'});
    socket.hostDomain = socket.handshake.query.hostDomain;
    socket.key_lic = socket.handshake.query.key_lic;
    socket.auth = false;
    query("SELECT * FROM servers WHERE ? AND ?", [{domain: socket.hostDomain}, {key_lic: socket.key_lic}], (result)=> {
        if (result.length == 1) {
            socket.serversID = result[0].id;
            socket.auth = true;
            console.warn('[Auth] OK! Server: ' + socket.hostDomain)
        } else {
            console.error('[Auth] Error! Server: ' + socket.hostDomain + ', key_lic: ' + socket.key_lic)
        }
    });

    socket.on('getBalance', function () {
        if (socket.auth) {
            getBalance(socket.serversID, (result)=> {
                socket.emit('balance', result);
            });
        }
    });
    socket.on('send_SMS', function (param) {
        if (socket.auth) {
            getBalance(socket.serversID, (result)=> {
                if (+result.balance > 0) {
                    sms.send(param.to, param.message, function (err, result) {
                        if (err) return console.error('[API]{sms.send letsads.com} ERROR:', err);
                        setBalance(socket.serversID, -0.009);
                        console.log(result);
                    });
                }
            });
        }
    });
    socket.on('send_Telegram', function (param) {
        if (socket.auth) {
            telegram.sendMessage(param.to, param.message);
        }
    });
    socket.on('send_Skype', function (param) {
        if (socket.auth) {
            skype.sendMessage("8:" + param.to, param.message);
        }
    });
    socket.on('disconnect', function () {
        socket.disconnect();
        socket.removeAllListeners();
    });
});
telegram.on('message', function (msg) {
    var chatId = msg.chat.id;
    var cmd = msg.text.split(':');
    if (cmd[0][0] == '/') {
        switch (cmd[0]) {
            case '/notify':
                if (cmd.length >= 4) {
                    var send = true;
                    for (var key in io.sockets.connected) {
                        if (io.sockets.connected.hasOwnProperty(key) && io.sockets.connected[key].hostDomain == cmd[1] && io.sockets.connected[key].auth) {
                            io.sockets.connected[key].emit('telegram_subscribe', {
                                adminID: cmd[2],
                                api_key: cmd[3],
                                chatId: chatId
                            });
                            send = false;
                        }
                    }
                    setTimeout(()=> {
                        if (send)
                            telegram.sendMessage(chatId, `Ошибка сервер ${cmd[1]} не найден или недоступен сейчас. Попробуйте позже.\n\nПоддержка: @medve_dev`);
                    }, 2000)
                } else {
                    telegram.sendMessage(chatId, `Ключ неверный перегрузите админ страницу и попробуйте повторить.\n\nПоддержка: @medve_dev`);
                }
                break;
            case '/help':
                telegram.sendMessage(chatId, `Ваш  TelegramID:${chatId}\n\nПоддержка: @medve_dev`);
                break;
            case '/disable':
                for (var key in io.sockets.connected) {
                    if (io.sockets.connected.hasOwnProperty(key) && io.sockets.connected[key].auth) {
                        io.sockets.connected[key].emit('telegram_unsubscribe', {chatId: chatId});
                        send = false;
                    }
                }
                telegram.sendMessage(chatId, 'Вы успешно отписаны от оповещений.');
                break
        }

    } else {
        telegram.sendMessage(chatId, 'Команда не найдена.\n\n Поддержка: @medve_dev');
    }
});