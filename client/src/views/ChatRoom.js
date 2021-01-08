import React, {createRef} from 'react';
import {withRouter} from "react-router";
import {connect} from "react-redux";
import {PropTypes} from "prop-types";
import "./ChatRoom.css";
import logo from "../images/logo.png";
import MemberList from "./components/MemberList";
import {Col, message, Row, Tooltip} from "antd";
import {LogoutOutlined} from "@ant-design/icons";
import MessageContainer from "./components/MessageContainer";
import MessageEditor from "./components/MessageEditor";
import socket from "../utils/socket";
import {JOIN, LEAVE, MSG, ONLINE_USERS} from "../utils/socket-types";
import {copyMap, formatString, GroupPrefix} from "../utils/tools";
import {reset, setCurrent} from "../redux/action/actions";


class ChatRoom extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // 用户在线列表
            memberList: [],
            // 聊天框中的信息
            messageMap: new Map(),
            // 搜索过滤词
            filter: "",
        }
        this.input = createRef()
        // 绑定方法到this中
        this.handleKeyEnter = this.handleKeyEnter.bind(this)
        this.handleSendMsg = this.handleSendMsg.bind(this)
        this.handleLogout = this.handleLogout.bind(this)
        this.handleSetUnread = this.handleSetUnread.bind(this)
    }

    componentDidMount() {
        document.title = "聊天室"
        const {login} = this.props

        // 从全局状态中获取值
        // 如果没有登录
        if (!login) {
            message.info("请先登录")
            this.props.history.push("/login")
            return
        }
        const {chatRoom} = this.props
        // 初始化
        this.setState({
            memberList: [{username: "【群聊】" + chatRoom, avatar: logo, unread: 0}],
        }, () => {
            console.log("in chat room: ", this.state, this.props)
        })

        // 监听数据
        socket.on(MSG, res => {
            const {chatRoom, current} = this.props

            console.log("收到消息: ", res)
            let map = copyMap(this.state.messageMap)
            let username;

            const {isGroup, msg} = res.data
            // 如果是群聊，那么名称应该加上标记
            if (isGroup) {
                username = GroupPrefix + chatRoom
                console.log("isGroup username: ", username)
            } else {
                username = msg.username
                console.log("not group, username: ", username)
            }

            // 获取群聊对应的信息
            const userMsg = map.get(username)

            // 将信息保存
            if (typeof userMsg === "undefined") {
                map.set(username, [msg])
            } else {
                userMsg.push(msg)
            }
            let tempList = [...this.state.memberList]
            // 将这条信息对应的用户未读信息加一
            console.log("username: ", username, " current: ", current)
            tempList.forEach(value => {
                if (value.username === username && current !== username) {
                    value.unread += 1
                }
            })
            console.log("收到消息前: this.state", this.state)
            this.setState({
                messageMap: map,
                memberList: tempList
            }, () => {
                console.log("接收到消息后: ", this.state)
            })
        })

        // 监听用户加入房间
        socket.on(JOIN, res => {
            console.log("JOIN res: ", res)
            let temp = [...this.state.memberList]
            temp.push(res)
            this.setState({
                memberList: temp
            }, () => {
                console.log("after join: ", this.state.memberList)
            })
        })

        // 监听用户离开事件
        socket.on(LEAVE, res => {
            console.log("LEAVE: ", res)
            const {memberList, messageMap} = this.state

            let temp = [...memberList].filter(value => {
                return value.username !== res.data;
            })

            // 删除该用户对应的消息记录
            let tempMessageMap = messageMap
            tempMessageMap.delete(res.data)

            this.setState({
                memberList: temp,
                messageMap: tempMessageMap
            })
        })

        // 获取到在线用户
        socket.on(ONLINE_USERS, res => {
            const {chatRoom, username} = this.props

            console.log("ONLINE_USERS", res)
            let temp = []
            // 第一个是群聊 群聊 logo确定！
            temp.push({username: GroupPrefix + chatRoom, avatar: logo, unread: 0})
            for (let user of res.data) {
                if (user.username !== username) {
                    temp.push({username: user.username, avatar: user.avatar, unread: 0})
                }
            }
            this.setState({
                memberList: temp,
            })
            console.log(this.state)
        })
    }

    // 搜索框，搜索用户名或者群聊
    handleKeyEnter(e) {
        this.setState({
            filter: this.input.current.value
        })
        const {setCurrent} = this.props
        setCurrent("")
    }

    // 处理用户发送信息
    handleSendMsg(msg) {
        const {current} = this.props
        let tempMessageMap = copyMap(this.state.messageMap)
        if (tempMessageMap.get(current)) {
            tempMessageMap.get(current).push(msg)
        } else {
            tempMessageMap.set(current, [msg])
        }
        console.log("after send msg: ", tempMessageMap)

        this.setState({
            messageMap: tempMessageMap
        })
    }

    // 设置当前正在聊天的用户
    handleSetUnread(username) {
        // 将badge清除
        let tempList = [...this.state.memberList]
        console.log(tempList)
        for (let el of tempList) {
            console.log(el.username)
            if (el.username === username) {
                el.unread = 0
            }
        }

        this.setState({
            memberList: tempList
        }, () => {
            console.log(this.state.memberList)
        })

        this.editor.clearMsg()
    }

    // 退出登录
    handleLogout() {
        const {reset, username} = this.props
        reset()
        socket.emit(LEAVE, {username: username})
        this.props.history.push("/login")
    }


    render() {
        console.log(new Date(), "ChatRoom render...")
        const {current, username, avatar} = this.props
        const {messageMap, memberList} = this.state
        // 获取当前聊天对应的所有信息记录
        // let message = messageMap.get(current) ? messageMap.get(current) : []
        // console.log(message)
        return <>
            <Row className={"chat-room"}>
                <Col span={2}>
                    <div className={"chat-room-sidebar"}>
                        <Tooltip title={username}>
                            <img src={avatar} className={"chat-room-avatar"} alt=""/>
                        </Tooltip>
                        <div className={"chat-room-username"} title={username}>
                            {formatString(4, username)}
                        </div>
                        <div className={"chat-room-logout"} title={"退出登录"}>
                            <LogoutOutlined onClick={this.handleLogout}/>
                        </div>
                    </div>
                </Col>
                <Col span={5}>
                    <div className="chat-room-container">
                        <div className="chat-room-group">
                            <div className={"chat-room-search"}>
                                <input ref={this.input} type="text" placeholder={"搜索"} className={"chat-room-input"}
                                       onChange={this.handleKeyEnter}/>
                            </div>
                            <MemberList setUnread={this.handleSetUnread} memberList={memberList}
                                        filter={this.state.filter}
                            />
                        </div>
                    </div>
                </Col>
                <Col span={17}>
                    <div style={{height: "70%"}}>
                        <MessageContainer message={messageMap.get(current) ? messageMap.get(current) : []}/>
                    </div>
                    <div style={{height: "30%"}}>
                        <MessageEditor ref={ref => {
                            this.editor = ref
                        }} handleMsg={this.handleSendMsg}
                        />
                    </div>
                </Col>
            </Row>
        </>
    }
}

ChatRoom.propTypes = {
    history: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
    return {
        username: state.username,
        chatRoom: state.chatRoom,
        current: state.current,
        avatar: state.avatar,
        login: state.login
    }
}

function mapDispatchToProps(dispatch) {
    return {
        setCurrent: (current) => dispatch(setCurrent(current)),
        reset: () => dispatch(reset()),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(ChatRoom))