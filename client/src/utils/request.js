export const FILE = "file"
export const TEXT = "text"
export const AUDIO = "audio"
// 返回值中code表示的意义
export const Success = 200  // 成功
export const Error = -1 // 失败

// 用户端发送的消息
export function Msg(type, username, avatar, msgType, data) {
    return {
        // 信息的泛类型，send or receive
        type: type,
        // 发送的用户，这里就是登录的用户
        username: username,
        // 登录用户的头像
        avatar: avatar,
        // 发送的时间
        date: new Date(),
        // 实际内容
        content: {
            // 标识是哪一种类型, 不支持video
            // text file audio
            type: msgType,
            data: data
        }
    }
}


export const ATTEMPT = "attempt"
export const CONNECT = "connect"

// 同意或者不同意
export const AGREE = "agree"
export const REJECT = "reject"
export const NOTSUPPORT = "not support"
// 没有找到该用户，存在此种极端情况
export const NOTFOUND = "not found"
// 忙碌中
export const BUSY = "busy"

export function VideoMsg(type, from, to, data) {
    return {
        // 请求建立连接，或者是请求之后开始建立连接
        // attempt, connect
        type: type,
        // 从哪里发出
        from: from,
        // 送到哪里
        to: to,
        // 携带的信息
        data: data
    }
}