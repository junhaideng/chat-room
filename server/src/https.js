// 将socket.io 绑定到http Server
const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();

const options = {
  cert: fs.readFileSync(path.join(__dirname, "./key/cert.pem")),
  key: fs.readFileSync(path.join(__dirname, "./key/key.pem")),
};

const server = require("https").createServer(options, app);
const io = require("socket.io")(server, {
  maxHttpBufferSize: 60 * 1024 * 1024, // 最大缓冲
});

const { log, INFO, ERROR } = require("./log/log");
const { getUserByUsername, insertUser } = require("./db/sqlite3");

const {
  CONNECTION,
  DISCONNECT,
  LOGIN,
  ONLINE_USERS,
  REGISTER,
  LEAVE,
  JOIN,
  MSG,
  PEER_CONNECTION_REQUEST,
  PEER_CONNECTION_RESPONSE,
  PEER_CONNECTION_CANDIDATE,
  PEER_CONNECTION_HANGUP,
} = require("./socket-types");

const { Response, NOTFOUND } = require("./utils/response");
const { getIPAddress } = require("./utils/get_ip");

// const GroupPrefix = "【群聊】";

// 从用户到socket的映射关系表
// 用户名对应的socket
let userToSocket = new Map();

// room到user的映射
// 一个房间里有哪些user
let roomToUser = new Map();

// socket.emit() ：向建立该连接的客户端广播
// socket.broadcast.emit() ：向除去建立该连接的客户端的所有客户端广播
// io.sockets.emit() ：向所有客户端广播，等同于上面两个的和

io.on(CONNECTION, (socket) => {
  console.log("connection --->", socket.id);
  // 单个连接中的用户名以及房间号
  // 在这里定义只是为了之后访问比较方便
  let username;
  let room;

  // 用户登录
  // 用户登录之后便会加入到一个特定的房间里
  // 我们需要保存该用户对应的socketid
  // 这样之后如果用户之间需要通信，使用该id查找对应的socket
  // 然后emit即可 username => socketid => socket => socket.emit
  socket.on(LOGIN, (data) => {
    // 解构并重命名
    const { username: username_, password: password_, chatRoom: room_ } = data;
    getUserByUsername(username_)
      .then((user) => {
        if (user === undefined) {
          socket.emit(LOGIN, Response(-1, {}, "用户不存在"));
          return;
        }
        if (user.password === password_) {
          // 先要进行检查是否已经登录了
          // 如果已经存在该用户, 不能再次登录
          if (userToSocket.has(username_)) {
            socket.emit(LOGIN, Response(-1, {}, "用户已登录"));
            return;
          }

          // 赋值
          username = username_;
          room = room_;

          // 加入房间
          socket.join(room_);

          // 将用户加入到room中
          if (roomToUser.has(room_)) {
            roomToUser
              .get(room_)
              .push({ username: username_, avatar: user.avatar });
          } else {
            roomToUser.set(room_, [
              { username: username_, avatar: user.avatar },
            ]);
          }
          // 设置用户对应的socket
          userToSocket.set(username_, socket.id);

          console.log("after join, now room map: ", roomToUser);

          // 通知客户端登录成功
          socket.emit(
            LOGIN,
            Response(
              200,
              { username: username_, avatar: user.avatar },
              `欢迎登录 ${username_}`
            )
          );

          console.log("tell others : ", roomToUser.get(room_));

          // 告诉用户房间里还有哪些用户
          socket.emit(
            ONLINE_USERS,
            Response(
              200,
              roomToUser.get(room_) ? roomToUser.get(room_) : [],
              null
            )
          );

          // 告诉房间里的其他人
          socket.to(room).emit(JOIN, {
            username: username_,
            avatar: user.avatar,
            unread: 0,
          });

          log(INFO, `${username_} logined, and joined room ${room_}`);

          return;
        } else {
          // 通知用户密码输入错误
          socket.emit(LOGIN, Response(-1, {}, "密码输入错误"));

          log(INFO, `${user.username} password error`);
          return;
        }
      })
      .catch((err) => {
        log(ERROR, err);
      });
  });

  // 用户注册
  socket.on(REGISTER, (data) => {
    const { username, password, avatar } = data;
    insertUser(username, password, avatar)
      .then((res) => {
        console.log("res: ", res);
        if (res.code === 200) {
          socket.emit(REGISTER, Response(200, {}, "注册成功"));
        } else {
          socket.emit(REGISTER, Response(-1, {}, "用户名已经被注册"));
        }
      })
      .catch((err) => {
        log(ERROR, err);
      });
  });

  // 用户退出登录或者断开
  // 我们需要进行一些相关处理
  socket.on(DISCONNECT, () => {
    console.log("disconnect: ", socket.id);
    log(INFO, `${username} disconnect`);

    console.info("now map: ", userToSocket);
    // 用户退出的时候需要进行其他的处理
    userToSocket.delete(username);
    // 退出房间
    socket.leave(room);
    // 退出之后需要对其他用户进行广播
    socket.to(room).emit(LEAVE, Response(200, username, null));
  });

  // 用户退出登录，和断开连接差不多
  socket.on(LEAVE, () => {
    log(INFO, `${username} leave room ${room}`);

    console.info("now map: ", userToSocket);
    // 用户退出的时候需要进行其他的处理
    userToSocket.delete(username);
    // 退出房间
    socket.leave(room);
    // 退出之后需要对其他用户进行广播
    socket.to(room).emit(LEAVE, Response(200, username, null));
  });

  // 用户发送的文本信息
  // 用户必须提供对应的发送方，以及信息
  // 通过用户名我们可以查到socket，进而emit发送消息
  socket.on(MSG, (req) => {
    const { isGroup, data } = req;
    console.log(isGroup, data.user, data.msg);
    // 如果是群聊
    if (isGroup) {
      // true 表示为群聊
      // 发送的时候有GroupPrefix的
      console.log(socket.rooms);
      socket
        .to(data.user.split("】")[1])
        .emit(MSG, Response(200, { isGroup: true, msg: data.msg }, null));
      return;
    }
    // 首先找到这个用户名对应的socket id
    console.log("userToSocket: ", userToSocket);
    const sid = userToSocket.get(data.user);
    if (sid) {
      // 使用socket发送信息
      // socket.to() 如果接收room的话，就发送到room里
      // 如果是socket id就发送给指定的socket
      socket
        .to(sid)
        .emit(MSG, Response(200, { isGroup: false, msg: data.msg }), null);
    }
  });

  // socket 类似一个代理，进行数据的转发
  // 过程详见
  socket.on(PEER_CONNECTION_REQUEST, (data) => {
    console.log("--------------------", new Date(), "---------------------");
    console.log("PEER_CONNECTION_REQUEST: ", JSON.stringify(data, null, 2));
    console.log(`>>> ${data.from} wants to send data to ${data.to} >>>`);

    let sid = userToSocket.get(data.to);

    if (sid) {
      console.log("Server emit PEER_CONNECTION_REQUEST");
      // 相对应的用户发送视频通话请求
      socket.to(sid).emit(PEER_CONNECTION_REQUEST, data);
      return;
    } else {
      socket.emit(PEER_CONNECTION_RESPONSE, {
        type: "attempt",
        data: {
          msg: NOTFOUND,
        },
      });
      log(ERROR, `PEER_CONNECTION_REQUEST: no so such user ${data.to}`);
    }
  });

  socket.on(PEER_CONNECTION_RESPONSE, (data) => {
    console.log("--------------------", new Date(), "---------------------");
    console.log("PEER_CONNECTION_RESPONSE: ", JSON.stringify(data, null, 2));
    console.log(`<<< ${data.from} response ${data.to} <<<`);

    let sid = userToSocket.get(data.to);
    if (sid) {
      console.log("Server emit PEER_CONNECTION_RESPONSE");
      // 向请求通话的一方返回响应数据
      socket.to(sid).emit(PEER_CONNECTION_RESPONSE, data);
    } else {
      log(ERROR, `PEER_CONNECTION_RESPONSE: no so such user ${data.to}`);
    }
  });

  // 传送 candidate
  socket.on(PEER_CONNECTION_CANDIDATE, (data) => {
    console.log("receive candidate data: ", JSON.stringify(data, null, 2));
    let sid = userToSocket.get(data.to);
    if (sid) {
      socket.to(sid).emit(PEER_CONNECTION_CANDIDATE, data);
    }
  });

  socket.on(PEER_CONNECTION_HANGUP, (data) => {
    let sid = userToSocket.get(data.to);
    if (sid) {
      socket.to(sid).emit(PEER_CONNECTION_HANGUP);
    }
  });
});

// PORT 为环境变量，应该与client中的对应
// TODO:
let PORT;
if (process.env.PORT) {
  PORT = process.env.PORT;
} else {
  PORT = 3001;
}

// 测试能否被局域网访问
app.get("/", (req, res) => {
  res.send("access success");
});

// 提供静态文件
app.use("/static", express.static(path.join(__dirname, "public")));

console.log(`listen port:${PORT}`);

server.listen(PORT);
