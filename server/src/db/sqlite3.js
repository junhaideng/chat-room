const path = require("path");
const sqlite3 = require("sqlite3").verbose();

let db = new sqlite3.Database(path.join(__dirname, "chat.db"));

// 查询数据
// 获取到用户名对应的用户
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    let stmt = db.prepare("SELECT * FROM chat WHERE username=?");
    stmt.get(username, (err, row) => {
      if (err !== null) {
        reject(err);
      }
      if (row === {}) {
        resolve({});
      } else {
        resolve(row);
      }
    });
  });
}

// 插入数据
// 将用户信息插入到数据库中
function insertUser(username, password, avatar) {
  return new Promise((resolve, reject) => {
    getUserByUsername(username)
      .then((user) => {
        // 如果没有注册
        if (typeof user === "undefined") {
          let stmt = db.prepare(
            "INSERT INTO chat (username, password, avatar) VALUES (?,?,?)"
          );
          stmt.run(username, password, avatar);
          resolve({ code: 200 });
        } else {
          resolve({ code: -1 });
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = {
  getUserByUsername,
  insertUser,
};
