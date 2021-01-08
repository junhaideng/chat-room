// 对客户端的响应值
 function Response(code, data, msg){
  return {
    code: code,
    data: data,
    msg: msg,
  }
}
const NOTFOUND = "not found"
module.exports = {
  Response,
  NOTFOUND,
}
