import React, {createRef} from 'react';
import {connect} from "react-redux";
import {PropTypes} from "prop-types";
import {FileImageOutlined, FileOutlined} from "@ant-design/icons";
import "./MessageContainer.css";
import VoiceLeft from "../../images/voice-left.svg";
import VoiceRight from "../../images/voice-right.svg";

const FileSaver = require("file-saver")

class MessageContainer extends React.Component {
    constructor(props) {
        super(props);

        // 引用聊天信息窗口，在信息进行改变的时候拖动到最底
        this.scrollbar = createRef()
        this.handleDownloadFile = this.handleDownloadFile.bind(this)
        this.handlePlayAudio = this.handlePlayAudio.bind(this)
    }

    handlePlayAudio(e) {
        // 先停止其他的一切audio的播放
        for (let audio of document.querySelectorAll("audio")) {
            audio.pause()
        }
        // 然后播放当前的
        const audio = e.currentTarget.querySelector("audio")
        if (audio.paused) {
            // 从头开始
            audio.currentTime = 0
            // 播放
            audio.play();
        } else {
            // 暂停播放
            audio.pause()
        }
    }


    // 添加信息之后滚动条自动滑动到最下面
    componentDidUpdate(prevProps, prevState, snapshot) {
        console.log(new Date(), "did update....")
        if (this.props !== prevProps) {
            this.scrollbar.current.scrollTop = this.scrollbar.current.scrollHeight
            return true
        }
        return false
    }


    handleDownloadFile(filename, file) {
        console.log(filename)
        console.log(`download ${filename}...`)
        let blob = new Blob([file])
        FileSaver(blob, filename)
    }

    render() {
        const {current, message} = this.props;
        console.log("message container render: ")
        const items = message.map((value, index) =>
            <div key={index.toString()} className={`chat-room-message-item-${value.type}`}>
                <div className="chat-room-message-item-avatar">
                    <img src={value.avatar} alt=""/>
                </div>

                <div className={"chat-room-message-item-body"}>
                    <div className={"chat-room-message-item-info"}>
                        {value.username}
                    </div>
                    {/*如果是文本消息*/}
                    {value.content.type === "text" ?
                        <div className={"chat-room-message-item-text"}>
                            {value.content.data}
                        </div>
                        :
                        // 如果是文件
                        (value.content.type === "file" ?
                                <div className={"chat-room-message-item-file"} title={"下载"}
                                     onClick={this.handleDownloadFile.bind(this, value.content.data.filename, value.content.data.file)}>
                                        <span
                                            className={"chat-room-message-item-file-icon"}> {value.content.data.type === "image" ?
                                            <FileImageOutlined/> : <FileOutlined/>}
                             </span>
                                    <span className={"chat-room-message-item-file-info"}>
                                            <div className={"chat-room-message-item-filename"}>
                                                {value.content.data.filename.length > 10 ? value.content.data.filename.slice(0, 10) + "..." : value.content.data.filename}
                                            </div>
                                       <div className={"chat-room-message-item-filesize"}>
                                           {value.content.data.filesize}
                                       </div>
                                        </span>

                                </div>
                                :
                                // 如果是音频
                                <div className={"chat-room-message-item-audio"} onClick={this.handlePlayAudio}
                                     title={"播放"}>
                                    <div className={"chat-room-message-item-audio-icon"}>
                                        {value.type === "send" ?
                                            <img src={VoiceRight} alt=""/>
                                            :
                                            <img src={VoiceLeft} alt=""/>
                                        }
                                    </div>
                                    <div className="chat-room-message-item-audio-duration">
                                        {value.content.data.duration}
                                    </div>
                                    <div>
                                        <audio
                                            src={URL.createObjectURL(new Blob(value.content.data.buffer, {type: "audio/mp3;codecs=opus"}))}/>
                                    </div>
                                </div>
                        )
                    }
                </div>
            </div>
        )
        return <div className="chat-room-message">
            <div className="chat-room-message-header">
                <div className={"chat-room-message-header-username"}>{current}</div>
            </div>
            <div ref={this.scrollbar} className="chat-room-message-body">
                {items}
            </div>
        </div>
    }
}

MessageContainer.propTypes = {
    message: PropTypes.array.isRequired,
    current: PropTypes.string.isRequired
}

const mapStateToProps = (state) => ({
        current: state.current
    }
)


export default connect(mapStateToProps)(MessageContainer)