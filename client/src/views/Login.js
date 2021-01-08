import React, {createRef} from "react"
import {withRouter} from "react-router-dom";
import {connect} from "react-redux";
import {PropTypes} from "prop-types";
import {Button, Form, Image, Input, message, Radio, Tabs} from "antd"
import {CommentOutlined, LockOutlined, UserOutlined} from '@ant-design/icons'
import "./Login.css";
import socket from "../utils/socket"
import {LOGIN, REGISTER} from "../utils/socket-types"
import {avatar} from "../mock/avatar";
import {Error, Success} from "../utils/request";
import {setAvatar, setChatRoom, setLogin, setUsername} from "../redux/action/actions";

// const {ipcRenderer} = window.require('electron')

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",  // 用户名
            password: "",  // 密码
            chatRoom: "",  // 房间号
            loading: false,  // 按钮是否在加载中
            activeKey: "1", // 选中的tab
        }

        this.loginForm = createRef();
        this.registerForm = createRef();

        this.handleLogin = this.handleLogin.bind(this)
        this.handleOnChange = this.handleOnChange.bind(this)
        this.handleTabClick = this.handleTabClick.bind(this)
    }

    componentDidMount() {
        console.log(this.props)
        const {history} = this.props
        document.title = "登录"

        // on 的放置在这里，不然可能会多次触发

        // 监听服务端处理登录结果，然后分别处理
        socket.on(LOGIN, res => {
            console.log("res: ", res)
            // 如果登录成功
            if (res.code === Success) {
                message.success(res.msg, 1)
                sessionStorage.setItem("login", "true")
                console.log(this.props)
                const {setUsername, setChatRoom, setAvatar, setLogin} = this.props
                setUsername(this.state.username)
                setChatRoom(this.state.chatRoom)
                setAvatar(res.data.avatar)
                setLogin(true)
                // 转换界面
                history.push("/chatroom")
                // ipcRenderer.send("chat-page")
            } else {
                message.error(res.msg, 1)
                this.setState({
                    loading: false
                })
            }

        })

        // 监听服务端处理注册的结果
        socket.on(REGISTER, res => {
            if (res.code === Error) {
                message.error(res.msg, 1)
            } else {
                message.success(res.msg, 1)
                this.setState({
                    activeKey: "1"
                })
            }
        })
    }

    // 登录
    handleLogin(value) {
        this.setState(value, () => {
            // 登录
            const {username, password, chatRoom} = value
            console.log(value)
            this.setState({
                loading: true,
                username: username,
                chatRoom: chatRoom,
            }, () => {
                console.log("this.state: ", this.state)
            })
            socket.emit(LOGIN, {username, password, chatRoom})
        })
    }

    // 处理注册事件
    handleRegister(value) {
        socket.emit(REGISTER, value)
    }

    // 跳转tab的时候清除之前表单中的内容
    handleTabClick(key) {
        this.setState({
            activeKey: key,
            loading: false,
        })
        if (key === "1") {
            this.registerForm.current.resetFields()
        } else {
            this.loginForm.current.resetFields()
        }
    }

    // 跳转tab
    handleOnChange(activeKey) {
        // 转换tab的时候清除相关的数据
        if (activeKey === 1 && activeKey !== this.state.activeKey) {
            this.registerForm.current.resetFields()
        } else {
            this.loginForm.current.resetFields()
        }
    }

    render() {
        return <>
            <div className={"chat-room-login-container"}>
                <Tabs type="card" activeKey={this.state.activeKey} onTabClick={this.handleTabClick} animated centered>
                    <Tabs.TabPane tab="登录" key={"1"}>
                        <Form name="login" onFinish={this.handleLogin} ref={this.loginForm}>
                            <Form.Item name="username" rules={[{required: true, message: '请输入用户名!'}]}>
                                <Input prefix={<UserOutlined className={"chat-room-login-icon"}/>} placeholder="用户名"/>
                            </Form.Item>
                            <Form.Item name="password" rules={[{required: true, message: '请输入密码!'}]}>
                                <Input
                                    prefix={<LockOutlined className={"chat-room-login-icon"}/>}
                                    type="password"
                                    placeholder="密码"
                                />
                            </Form.Item>
                            <Form.Item name="chatRoom" rules={[{required: true, message: '请输入房间号!'}]}>
                                <Input
                                    prefix={<CommentOutlined className={"chat-room-login-icon"}/>}
                                    placeholder="房间号"
                                />
                            </Form.Item>
                            <Form.Item>
                                <Button htmlType="submit" loading={this.state.loading} type="primary" block>
                                    登录
                                </Button>
                            </Form.Item>
                        </Form>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="注册" key={"2"}>
                        <Form name="register" onFinish={this.handleRegister} ref={this.registerForm}
                              initialValues={{avatar: avatar[0]}}>
                            <Form.Item name="username" rules={[{required: true, message: '请输入用户名!'}]}>
                                <Input prefix={<UserOutlined className={"chat-room-login-icon"}/>} placeholder="用户名"/>
                            </Form.Item>
                            <Form.Item name="password" rules={[{required: true, message: '请输入密码!'}]}>
                                <Input
                                    prefix={<LockOutlined className={"chat-room-login-icon"}/>}
                                    type="password"
                                    placeholder="密码"
                                />
                            </Form.Item>
                            <Form.Item name="avatar" label={"头像"} rules={[{message: '请选择头像!'}]}>
                                <Radio.Group>
                                    {avatar.map((src, index) => <Radio value={src} key={index}><Image width={43}
                                                                                                      preview={false}
                                                                                                      src={src}/></Radio>)}
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item>
                                <Button htmlType="submit" loading={this.state.loading} type="primary" block>
                                    注册
                                </Button>
                            </Form.Item>
                        </Form>
                    </Tabs.TabPane>
                </Tabs>
            </div>
        </>
    }
}

// 将函数映射到props中
function mapDispatchToProps(dispatch) {
    return {
        setUsername: (username) => dispatch(setUsername(username)),
        setChatRoom: (room) => dispatch(setChatRoom(room)),
        setAvatar: (avatar) => dispatch(setAvatar(avatar)),
        setLogin: (flag) => dispatch(setLogin(flag)),
    }
}

Login.propTypes = {
    history: PropTypes.object.isRequired
}

export default connect(null, mapDispatchToProps)(withRouter(Login))
