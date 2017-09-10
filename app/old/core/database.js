'use strict';

var path = require('path'),
    config = require(path.join(__dirname, '../../config.json'), 'dont-enclose'),
    mysql = require('mysql'),

    pool,
    connection;


var optionMySQL = {
    connectionLimit: config.connectionLimit,
    host: config.db_host,
    user: config.db_user,
    password: config.db_password,
    database: config.db_name,
    useConnectionPooling: false,
    keepAlive: true,
    keepAliveInterval: 30000
};

function createPool(option) {
    pool = mysql.createPool(option);
    pool.on('connection', function (connection) {
        connection.on("error", function (error) {
            console.error('Ощибка в работе базы данных : ', error);
        });
        connection.on("end", function () {
            console.error('Сойденение  закрыто !');
        });

    });
    pool.on('enqueue', function () {
        console.log('Нет свободного connect MySQL.');
    });
}
function connectPool(callback) {
    pool.getConnection((err, conn)=> {
        if (err) {
            console.error('Ошибка подключение к Pool: ', err);
        } else {
            connection = conn;
            if (callback) {
                callback(conn);
            }
        }
    });
}
function releasePool(conn) {

    conn.release();

}
function startSQL(connIS, sql, callback) {
    connIS.query(sql, (err, row)=> {
        if (err) {
            console.error("Database-core: " + err + ', SQL:' + sql);
        } else {
            //console.log('SQL:' + sql, '| Result: ');
            //console.log(row);
            if (callback) {
                callback(row);
            }

            releasePool(connIS); //  Времменно  после запроса закрываем сойденение

        }

    });
}
function query(sql, callback) {
    //if (connection === undefined) {
    connectPool((conn)=> { // Временно  каждый  запрос = коннект
        startSQL(conn, sql, callback);
    });
    //} else {
    //        startSQL(connection, sql, callback);
    //}
}


module.exports.createPool = createPool;
module.exports.endPool = ()=> {
    pool.end();
};
module.exports.connectPool = connectPool;
module.exports.releasePool = releasePool;
module.exports.startSQL = startSQL;
module.exports.query = query;
module.exports.mysql = mysql;
this.createPool(optionMySQL);
//this.createPool(optionMySQL);
//setTimeout(()=> {
//    releasePool(connection)
//}, 5000);