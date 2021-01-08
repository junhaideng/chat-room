import React from "react";
import {connect} from "react-redux";
import {PropTypes} from "prop-types";
import {Button, message, Modal, Space} from "antd";
import {CloseCircleOutlined } from "@ant-design/icons";
import Draggable from "react-draggable";
import "./Video.css";
import socket from "../../utils/socket";
import {
    PEER_CONNECTION_CANDIDATE,
    PEER_CONNECTION_HANGUP,
    PEER_CONNECTION_REQUEST,
    PEER_CONNECTION_RESPONSE
} from "../../utils/socket-types";
import {AGREE, ATTEMPT, BUSY, CONNECT, NOTFOUND, NOTSUPPORT, REJECT, Success, VideoMsg} from "../../utils/request";
import {checkSupport, isGroup} from "../../utils/tools";

// RTCPeerConnection 相关配置
let servers = {iceServers: [{urls: 'stun:stun1.l.google.com:19302'}]};

const offerOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};


class Video extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // 是否已经连接
            isConnected: false,
            // 是否取消通话
            isCanceled: false,
            // 远程用户名
            remote: "",
        };
        this.pc = null;
        this.localStream = null;
        this.message = null;

        this.handleCall = this.handleCall.bind(this);
        this.handleHangUp = this.handleHangUp.bind(this);
        this.createPeerConnection = this.createPeerConnection.bind(this);
        this.createAnswerToOffer = this.createAnswerToOffer.bind(this);
        this.createOffer = this.createOffer.bind(this);
        this.handleConnectionFailed = this.handleConnectionFailed.bind(this);
        this.handleMinorVideoClick = this.handleMinorVideoClick.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }


    componentDidMount() {
        // 主动方发送请求，被动方接收请求
        socket.on(PEER_CONNECTION_REQUEST, (req) => {
            if (this.state.isConnected) {
                socket.emit(PEER_CONNECTION_RESPONSE, VideoMsg(ATTEMPT, this.props.username, req.from, {
                    msg: BUSY
                }))
                return
            }
            console.log("receive req: ", req)
            // remote尝试建立连接，通知用户是否同意
            if (req.type === ATTEMPT) {
                let config = {
                    title: `${req.from} 请求视频通话`,
                    onOk: () => {
                        if (!checkSupport()) {
                            socket.emit(PEER_CONNECTION_RESPONSE, VideoMsg(ATTEMPT, this.props.username, req.from, {
                                msg: NOTSUPPORT
                            }))
                            return
                        }
                        // 同意建立请求
                        socket.emit(PEER_CONNECTION_RESPONSE, VideoMsg(ATTEMPT, this.props.username, req.from, {
                            msg: AGREE
                        }))
                        // 创建PeerConnection
                        this.pc = this.createPeerConnection(req.from)
                        this.setState({
                            remote: req.from
                        })
                    },
                    onCancel: () => {
                        // 拒绝
                        socket.emit(PEER_CONNECTION_RESPONSE, VideoMsg(ATTEMPT, this.props.username, req.from, {
                            msg: REJECT
                        }))
                    }
                }
                Modal.confirm(config)
            }

            // 如果用户已经同意了，那么开始建立连接
            else if (req.type === CONNECT) {
                if(this.state.isCanceled){
                    
                }
                console.log(`开始与${req.from}建立连接`)
                this.createAnswerToOffer(req)
            } else {
                message.error("请求类型错误")
                console.log("请求类型错误")
            }
        });

        // 发送请求的一方接收对方返回的数据
        socket.on(PEER_CONNECTION_RESPONSE, (res) => {
            if (this.message){
                this.message();
            }
            console.log("receive res: ", res);
            // 远程回复请求的消息
            if (res.type === ATTEMPT) {
                if(this.state.isCanceled){
                    this.handleConnectionFailed(res, "对方已经取消")
                    return
                }
                if (res.data.msg === AGREE) {
                    this.createOffer()
                } else if (res.data.msg === BUSY) {
                    message.info("对方正在通话中")
                } else if (res.data.msg === NOTSUPPORT) {
                    message.info("对方环境不支持该功能")
                } else if (res.data.msg === NOTFOUND) {
                    message.info("没有找到该用户")
                } else {
                    message.info("对方拒绝通话")
                }

            } else if (res.type === CONNECT) {
                if (res.data.code === Success) {
                    this.props.openVideo(true)
                    // 通话建立成功，设置本地流
                    this.local.srcObject = this.localStream

                    // 设置远程的sdp
                    this.pc.setRemoteDescription(new RTCSessionDescription(res.data.data.sdp)).then(() => {
                        console.log("local set remote sdp success")
                    }).catch(err => {
                        console.log("local set remote sdp err: ", err)
                    })
                } else {
                    message.info(res.data.msg)
                }
            }
        });

        // 接收到远程的iceCandidate，pc中增加对应的信息
        socket.on(PEER_CONNECTION_CANDIDATE, res => {
            console.log(`this pc: ${this.pc === null}`)
            if (this.pc) {
                // 注
                // 这里可能会报错，可能是因为时延的问题
                // 本地相互呼叫没有问题，本地呼叫移动端没问题
                // 移动端呼叫本地有时会出现该类错误(可能建立不)，两个第三方设备使用本地服务端进行呼叫也没有问题
                this.pc.addIceCandidate(new RTCIceCandidate(res.data.candidate)).then(() => {
                    console.log("add candidate success")
                }).catch(err => {
                    console.log("add iceCandidate error: ", err.toString())
                })
            } else {
                console.error("no peerConnection available")
            }
        })

        // 获取到对方断开连接的消息
        socket.on(PEER_CONNECTION_HANGUP, () => {
            message.info("对方断开连接")
            this.handleHangUp(false)
        })
    }

    handleCancel(){
        this.setState({
            isCanceled: true
        }, ()=>{
            if(this.message){
                this.message()
            }
            console.log(this.state)
        })
    }

    // 拨打视频
    handleCall() {
        // 重新初始化一下
        this.setState({
            isConnected: false,
            isCanceled: false,
            remote: "",
        })
        const {current, username} = this.props
        if (current) {
            if (isGroup(current)) {
                message.info("群聊暂不支持视频通话")
                return
            }
            // 30s自动取消，也可以手动关闭
            this.message = message.loading(<>正在请求中... <CloseCircleOutlined onClick={this.handleCancel}/></>, 30, ()=>this.handleCancel)
            console.log(`${username} want to call ${current}`)
            // 通知remote请求建立连接
            socket.emit(PEER_CONNECTION_REQUEST, VideoMsg(ATTEMPT, username, current, null))
        } else {
            message.info("请选择发送的对象(除群聊)")
        }
    }

    // 获取本地的媒体，创建offer发送给对方
    createOffer() {
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        }).then(stream => {
            console.log("local get stream ...")
            this.localStream = stream
            this.local.srcObject = stream;

            // 创建pc
            this.pc = this.createPeerConnection(this.props.current)
            this.pc.oniceconnectionstatechange = (ev) => {
                console.log("oniceconnectionstatechange", ev)
                console.log("iceConnectionState: ", this.pc.iceConnectionState)
                if (this.pc.iceConnectionState === "disconnected") {
                    message.info("对方已断线", 2)
                    this.handleHangUp(false)
                    this.props.openVideo(false)
                    this.setState({
                        isConnected: false
                    })
                }
                if(this.pc.iceConnectionState === "connected"){
                    this.setState({
                        isConnected: true
                    })
                    this.props.setConnect(true)
                }
            }

            // 添加本地流信息
            this.localStream.getTracks().forEach(track => {
                console.log("add local stream")
                this.pc.addTrack(track, this.localStream)
            })

            console.log("create offer, and send to remote")
            // 本地创建offer, 然后发送给对方
            this.pc.createOffer(offerOptions).then(offer => {
                this.pc.setLocalDescription(offer).then(() => {
                    console.log(offer.sdp)
                    const {username, current} = this.props
                    socket.emit(PEER_CONNECTION_REQUEST, VideoMsg(CONNECT, username, current, {
                        data: {
                            sdp: offer
                        }
                    }))
                })
            })
        }).catch(err => {
            console.log("获取媒体设备失败: ", err)
            if (err.name === "NotReadableError") {
                message.error("无法获取对应设备")
            } else if (err.name === "NotAllowedError") {
                message.error("拒绝访问媒体设备")
            } else {
                message.error("获取媒体设备错误: ", err.message)
            }
            this.handleHangUp(false)
            this.props.openVideo(false)
        })

    }


    // 创建PeerConnection，并且设置相关的媒体信息
    createPeerConnection(to) {

        this.setState({
            remote: to
        })
        // 创建一个connection
        let pc = new RTCPeerConnection(servers)

        // 将收集到的iceCandidate发送到remote
        // setLocalDescription的时候触发
        pc.onicecandidate = ev => {
            console.log(" onicecandidate ev: ", ev)
            if (ev.candidate) {
                socket.emit(PEER_CONNECTION_CANDIDATE, {
                    to: to,
                    from: this.props.username,
                    data: {
                        candidate: ev.candidate
                    }
                })
            }
        }

        pc.onnegotiationneeded = () => {
            console.log("call ", "onnegotiationneeded")
        }

        // 远程 stream 达到本地, 进行处理
        pc.ontrack = ev => {
            console.log(`${this.props.username} ontrack: `, ev)
            if (this.remote.srcObject !== ev.streams[0]) {
                this.remote.srcObject = ev.streams[0]
                console.log("receive remote stream")
            }
        }

        return pc
    }


    // 挂断电话
    handleHangUp(needNotice) {
        console.log("hang up")
        // 关闭RTCPeerConnection
        if (this.pc) {
            this.pc.close()
            console.log("close RPCPeerConnection")
            this.pc = null
        }

        // 停用媒体设备
        if (this.localStream) {
            for (let track of this.localStream.getTracks()) {
                track.stop()
            }
            this.localStream = null
        }

        if (this.local) {
            this.local.srcObject = null
        }
        if (this.remote) {
            this.remote.srcObject = null
        }

        if (needNotice) {
            // 通知对方
            socket.emit(PEER_CONNECTION_HANGUP, {
                to: this.state.remote,
            })
        }

        // 关闭视频聊天界面
        this.props.openVideo(false)

        // 重新设置状态
        this.setState({
            isConnected: false,
            isCanceled: false,
        })
    }


    // 处理remote发送来的offer，并且创建对应的answer发送给remote
    createAnswerToOffer(req) {

        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        }).then(stream => {
            this.localStream = stream
            // 设置本地的视频连接
            this.local.srcObject = stream

            // 添加本地流信息
            this.localStream.getTracks().forEach(track => {
                console.log("add local stream")
                this.pc.addTrack(track, this.localStream)
            })

            // 本地打开视频界面
            this.props.openVideo(true)
            // 设置远程描述
            this.pc.setRemoteDescription(new RTCSessionDescription(req.data.data.sdp)).then(() => {
                // 生成应答，并发送给对方
                this.pc.createAnswer().then(answer => {
                    this.pc.setLocalDescription(answer).then(() => {
                        console.log("create answer: ", answer.sdp)
                        socket.emit(PEER_CONNECTION_RESPONSE, VideoMsg(CONNECT, this.props.username, req.from, {
                            code: Success,
                            data: {
                                sdp: answer
                            }
                        }))
                    })

                })
            }).catch(err => {
                console.log(PEER_CONNECTION_REQUEST, " set remote sdp err: ", err)
                message.error(`create answer error:  set remote sdp err: ${err.toString()}`)
            })
        }).catch(err => {
            console.log(err)
            // 获取媒体设备失败
            message.error("无法获取媒体设备")
            this.handleConnectionFailed(req, "对方无法获取对应媒体设备")
            // 关闭通话界面
            this.props.openVideo(false)
            this.handleHangUp(false)
        })
    }

    // 通话建立失败
    handleConnectionFailed(req, msg) {
        socket.emit(PEER_CONNECTION_RESPONSE, VideoMsg(CONNECT, this.props.username, req.from, {
            msg: msg
        }))
    }

    // 转换两个video
    handleMinorVideoClick() {
        let temp = this.local.srcObject
        this.local.srcObject = this.remote.srcObject
        this.remote.srcObject = temp
        this.local.muted = !this.local.muted
        this.remote.muted = !this.remote.muted
    }

    render() {
        return (<>
                <div className={"chat-room-video-container"}>
                    <video ref={ref => {
                        this.remote = ref;
                    }} className={"chat-room-video-main"} autoPlay playsInline/>
                    <Draggable bounds={".chat-room-video-main"}>
                        <video ref={ref => {
                            this.local = ref;
                        }} onClick={this.handleMinorVideoClick} className={"chat-room-video-minor"} playsInline
                               autoPlay muted={true}/>
                    </Draggable>
                    <div className={"chat-room-video-button"}>
                        <Space>
                            <Button onClick={this.handleHangUp.bind(this, true)}
                                    type={"danger"}>hang up</Button>
                        </Space>
                    </div>
                </div>
            </>
        )
    }
}

function mapStateToProps(state) {
    return {
        username: state.username,
        current: state.current,
    }
}

Video.propTypes = {
    openVideo: PropTypes.func.isRequired,
    setConnect: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, null, null, {forwardRef: true})(Video);
