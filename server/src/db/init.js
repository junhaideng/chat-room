// 数据库初始化
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('chat.db');

db.run("CREATE TABLE chat (username varchar(30) UNIQUE NOT NULL, password varchar(40) NOT NULL, avatar varchar(120) NOT NULL)");
db.close();
