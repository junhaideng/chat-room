const CONNECTION = "connection";
const DISCONNECT = "disconnect";
const LOGIN = "login";
const REGISTER = "register";
const LOGOUT = "logout";

const JOIN = "join"; // 加入房间
const LEAVE = "leave"; // 退出房间
const ONLINE_USERS = "online_users"; // 在线用户

const MSG = "msg"; // 消息

const PEER_CONNECTION_REQUEST = "PeerConnection_request"; // 请求建立视频连接
const PEER_CONNECTION_RESPONSE = "PeerConnection_response"; // 建立视频连接响应
const PEER_CONNECTION_CANDIDATE = "PeerConnection_candidate"; // 建立连接需要的iceCandidate
const PEER_CONNECTION_HANGUP = "PeerConnection_hangup"; // 关闭连接

module.exports = {
  CONNECTION,
  DISCONNECT,

  LOGIN,
  REGISTER,
  LOGOUT,
  JOIN,
  LEAVE,
  ONLINE_USERS,

  MSG,

  PEER_CONNECTION_REQUEST,
  PEER_CONNECTION_RESPONSE,
  PEER_CONNECTION_CANDIDATE,
  PEER_CONNECTION_HANGUP,
};
