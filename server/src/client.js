const { VIDEO_REQUEST, VIDEO_RESPONSE } = require("./socket-types");

const socket = new WebSocket();

/*
data: 
{
  to:xxx, //  发送给谁
  data:{
    username: xxx, // 发送者
    sdp: xxx,
  }
}
*/
// request -> 
socket.on(VIDEO_REQUEST, (data)=>{
  console.log("from username: ", data.username)
  console.log("sdp: ", sdp)

  let peer = new RTCPeerConnection({})
  let sdp = peer.createOffer()
  peer.setRemoteDescription(data.sdp)


  // 回复
  socket.emit(VIDEO_RESPONSE, data.data)
})


// response 一定是server返回的，不需要进行回复
socket.on(VIDEO_RESPONSE, (data)=>{
  console.log("from username: ", data.username)
  console.log("sdp: ", sdp)

  let peer = new RTCPeerConnection({})
  let sdp = peer.createOffer()
  peer.setRemoteDescription(data.sdp)
})


// clientA -> request server  --> request clientB
// clientB -> response server ---> response clientA