import React, {createRef} from 'react';
import {PropTypes} from 'prop-types';
import {connect} from "react-redux";
import {Button, Col, message, Modal, Popover, Row, Space, Tooltip, Upload} from 'antd';
import {AudioOutlined, FolderOutlined, SmileOutlined, VideoCameraOutlined} from '@ant-design/icons';

import "./MessageEditor.css";
import Emoji from "./Emoji";
import FilePreviewIcon from "./FilePreviewIcon";
import socket from "../../utils/socket";
import {MSG} from "../../utils/socket-types";
import {AUDIO, FILE, Msg, TEXT} from "../../utils/request";
import Video from "./Video";
import {checkSupport, isGroup} from "../../utils/tools";

// 录制下来的音频数据，可以发送到对方
let recorderData = []

// 录制对象
let mediaRecorder;

class MessageEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // 需要发送数据的类型
            type: "text",
            // 输入框中的文本信息
            text: "",
            // 选择的文件
            file: null,
            // 录下的音频
            audio: null,
            startBtn: false,
            sendBtn: true,
            // 在选择文件之后，显示文件的信息，而不是原来的文本信息
            hidden: true,
            // 弹出框，用来录制用户的语音
            visible: false,
            videoVisible: false,
            // 时间，用来计时
            time: 0,
            // 是否存在视频连接
            isConnected: false,
        }
        this.video = createRef()
        this.text = createRef()
        this.audioIcon = createRef()

        // 绑定方法
        this.handleSendMsg = this.handleSendMsg.bind(this)
        this.handleEmojiClick = this.handleEmojiClick.bind(this)
        this.handleSendFile = this.handleSendFile.bind(this)
        this.handleVoiceClick = this.handleVoiceClick.bind(this)
        this.handleVideoClick = this.handleVideoClick.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)

        this.deleteFile = this.deleteFile.bind(this)

        this.handleOk = this.handleOk.bind(this)
        this.handleCancel = this.handleCancel.bind(this)
        this.handleClose = this.handleClose.bind(this)

        this.handleVideoClose = this.handleVideoClose.bind(this)
        this.handleVideoUIShow = this.handleVideoUIShow.bind(this);
        this.clearMsg = this.clearMsg.bind(this);
    }

    // clear message
    clearMsg() {
        // 清空输入框
        this.text.current.value = ""
    }

    // 发送文本消息
    handleSendMsg() {
        const {current, username, avatar, handleMsg} = this.props
        const {type} = this.state
        if (!current) {
            message.info("请选择发送对象")
            return
        }
        if (type !== "text") {
            if (type === "file") {
                this.handleSendFile()
            }
            return
        }
        // 如果没有消息
        if (this.text.current.value.trim() === "") {
            message.info("消息不能为空")
            this.clearMsg()
            return
        }

        // 将信息添加到父组件的state中
        handleMsg(Msg("send", username, avatar, TEXT, this.text.current.value))

        // 发送数据
        if (this.state.type === "text") {
            // 如果是群聊，那么isGroup为true，服务端进行判断然后发送
            // 对于他人来说应该是receive
            let msg_ = Msg("receive", username, avatar, TEXT, this.text.current.value)
            if (isGroup(current)) {
                socket.emit(MSG, {isGroup: true, data: {user: current, msg: msg_}})
            } else {
                socket.emit(MSG, {isGroup: false, data: {user: current, msg: msg_}})
            }
        }

        this.clearMsg()
    }

    // 选中表情之后，需要对输入框内容进行添加
    // 其他逻辑与发送文本消息一样
    handleEmojiClick(emoji) {
        const cursorStart = this.text.current.selectionStart;
        this.text.current.value = this.text.current.value.slice(0, cursorStart) + emoji + this.text.current.value.slice(cursorStart)
    }


    // 发送文件
    handleSendFile() {
        const {username, avatar, current, handleMsg} = this.props
        const {file} = this.state

        if (file.size > 1024 * 1024 * 50) {
            message.error("不支持传送大于50MB的文件")
            return
        }

        // 格式化文件大小
        const formatFilesize = (filesize) => {
            console.log("filesize: ", filesize)
            if (filesize < 1024) {
                return +"B"
            } else if (filesize < 1024 * 1024) {
                return Number(filesize / 1024).toFixed(1) + "KB"
            } else if (filesize < 1024 * 1024 * 50) { // 一次性不支持发送大于50MB的文件
                return Number(filesize / 1024 / 1024).toFixed(1) + "MB"
            } else {
                return "NaN"
            }
        }

        handleMsg(Msg("send", username, avatar, FILE, {
            filesize: formatFilesize(file.size),
            filename: file.name,
            type: /image.*?/.test(file.name) ? "image" : "file",  // 简单判断一下即可
            file: file
        }))

        socket.emit(MSG, {
            isGroup: isGroup(current), data: {
                user: current, msg: Msg("receive", username, avatar, FILE, {
                    filesize: formatFilesize(file.size),
                    filename: file.name,
                    type: /image.*?/.test(file.name) ? "image" : "file",
                    file: file
                })
            }
        })
        this.deleteFile()
    }

    // 语音
    handleVoiceClick() {
        if (!checkSupport()) {
            return
        }
        const {current} = this.props
        if (!current) {
            message.info("请选择需要发送的对象")
            return
        }
        this.setState({
            visible: true,
        })
    }

    // 开始录制音频
    handleOk() {
        message.info("开始录制", 1)
        this.setState({
            startBtn: true,
            sendBtn: false,
        })
        const {username, avatar, current, handleMsg} = this.props

        navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
            console.log(stream)
            // 音频录制
            mediaRecorder = new MediaRecorder(stream)
            mediaRecorder.start();
            this.audioIcon.current.className = "active"
            this.setState({
                time: Date.now()
            })

            mediaRecorder.ondataavailable = (evt) => {
                recorderData.push(evt.data)
            }

            mediaRecorder.onstop = () => {
                let time = Date.now() - this.state.time
                window.r = mediaRecorder

                handleMsg(Msg("send", username, avatar, AUDIO, {
                    duration: Math.ceil(time / 1000) + `"`,
                    buffer: recorderData,
                }))

                socket.emit(MSG, {
                    isGroup: isGroup(current), data: {
                        user: current, msg: Msg("receive", username, avatar, AUDIO, {
                            duration: Math.ceil(time / 1000) + `"`,
                            buffer: recorderData,
                        })
                    }
                })
                this.setState({
                    visible: false,
                    sendBtn: true,
                    startBtn: false,
                })
                // 停止使用媒体设备
                for (let track of stream.getTracks()) {
                    console.log("stop ", track)
                    track.stop()
                }
            }
        }).catch(err => {
            console.log(err)
            message.error("获取音频设备失败")
        })

    }

    // 停止录制
    handleCancel() {
        this.audioIcon.current.className = ""
        if (mediaRecorder && mediaRecorder.state === "recording") {
            console.log("stop record")
            mediaRecorder.stop()
        }
        this.setState({
            visible: false,
        })
    }

    // 关闭modal
    handleClose() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            let config = {
                title: "这将会关闭并清除录制的音频，是否继续",
                onOk: () => {
                    this.audioIcon.current.className = null

                    this.setState({
                        visible: false,
                        startBtn: false,
                        sendBtn: true,
                    })
                    mediaRecorder = null
                }
            }
            Modal.confirm(config)
        } else {
            this.audioIcon.current.className = null
            this.setState({
                visible: false,
                startBtn: false,
                sendBtn: true,
            })
        }


    }

    // 进行视频通话
    handleVideoClick() {
        if (!checkSupport()) {
            return
        }
        const {current} = this.props
        if (isGroup(current)) {
            message.info("群聊暂不支持视频通话", 2)
            return
        }
        this.video.current.handleCall()
    }

    handleVideoUIShow(flag) {
        this.setState({
            videoVisible: flag
        })
    }

    // 关闭视频通话
    handleVideoClose() {
        // 如果当前存在连接
        if (this.state.isConnected) {
            let config = {
                title: "这将会关闭已有的视频连接，是否继续",
                onOk: () => {
                    this.setState({
                        videoVisible: false
                    })
                    this.video.current.handleHangUp(true)
                }
            }
            Modal.confirm(config)
        } else {
            this.setState({
                videoVisible: false
            })
            this.video.current.handleHangUp(false)
        }
    }


    // 设置发送快捷键
    handleKeyDown(e) {
        if (e.ctrlKey && e.keyCode === 13) {
            this.handleSendMsg()
        }
    }

    // 删除文件
    deleteFile() {
        // 暂不支持同时发送文件和文本信息
        // 删除的时将原来的文本中的内容删除
        console.log("delete file")
        this.setState({
            file: null,
            hidden: true,
            text: "",
            type: "text",
        })
    }

    render() {
        // upload组件配置
        const props = {
            beforeUpload: file => {
                this.setState({
                    file: file,
                    hidden: false,
                    type: "file",
                }, () => {
                    window.file = this.state.file
                });
                return false;
            },
            showUploadList: false,
        }

        // 使用下面的代码会有Change:::true一类的报错，但是没有关系，是组件问题
        return <div className={"chat-room-message-editor"}>
            <div className="chat-room-message-editor-toolbox">
                <Space size={"middle"}>
                    <Popover placement="topLeft" title={false}
                             content={<Emoji handleEmojiClick={this.handleEmojiClick}/>} trigger="hover">
                        <SmileOutlined className={"chat-room-message-editor-toolbox-item"}/>
                    </Popover>
                    {/*手动上传，也就是用户手动发送文件*/}
                    <Upload {...props}>
                        <FolderOutlined
                            className={"chat-room-message-editor-toolbox-item"}/>
                    </Upload>

                    <Tooltip title={"语音"}>
                        <AudioOutlined onClick={this.handleVoiceClick}
                                       className={"chat-room-message-editor-toolbox-item"}/>
                    </Tooltip>

                    <Modal
                        visible={this.state.visible}
                        onCancel={this.handleClose}
                        centered
                        maskClosable={false}
                        footer={null}
                        width={300}
                        bodyStyle={{padding: 10}}
                    >
                        <Row>
                            <Col span={24}>
                                <div className={"chat-room-modal-audio"}>
                                    <AudioOutlined ref={this.audioIcon}/>
                                </div>
                            </Col>
                            <Col span={24} style={{textAlign: "center"}}>
                                <Space>
                                    <Button onClick={this.handleOk} disabled={this.state.startBtn}>开始</Button>
                                    <Button type={"primary"} onClick={this.handleCancel}
                                            disabled={this.state.sendBtn}>发送</Button>
                                </Space>
                            </Col>
                        </Row>

                    </Modal>

                    <Tooltip title={"视频通话"}>
                        <VideoCameraOutlined onClick={this.handleVideoClick}
                                             className={"chat-room-message-editor-toolbox-item"}/>
                    </Tooltip>
                    <Modal
                        visible={this.state.videoVisible}
                        onCancel={this.handleVideoClose}
                        footer={null}
                        maskClosable={false}
                        width={600}
                        centered
                        closable={false}
                        bodyStyle={{padding: 0, height: 450}}
                        forceRender
                    >
                        <Video ref={this.video}
                               openVideo={this.handleVideoUIShow}
                               setConnect={(flag) => this.setState({isConnected: flag})}/>

                    </Modal>
                </Space>
            </div>
            <textarea hidden={!this.state.hidden} onKeyDown={this.handleKeyDown} ref={this.text}
                      className={"chat-room-message-editor-textarea"}
                      placeholder={"请输入你需要发送的内容"}/>
            <div hidden={this.state.hidden}>
                {this.state.file ?
                    <FilePreviewIcon type={this.state.file.type}
                                     filename={this.state.file.name} deleteFile={this.deleteFile}/>
                    : <></>}
            </div>
            <div className={"chat-room-message-editor-btn"}>
                <Button onClick={this.handleSendMsg}>发送</Button>
            </div>
        </div>
    }
}

function mapDispatchToProps(dispatch) {
    return {
        setCurrent: (current) => dispatch(current),
    }
}

const mapStateToProps = (state) => ({
        username: state.username,
        avatar: state.avatar,
        current: state.current,
    }
)

MessageEditor.propTypes = {
    handleMsg: PropTypes.func.isRequired,
}

export default connect(mapStateToProps, mapDispatchToProps, null, {forwardRef: true})(MessageEditor)