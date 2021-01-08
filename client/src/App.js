import React from "react";
import './App.css';
import Login from "./views/Login";
// 使用hash路由，避免每一次刷新网页更换一个socket id带来的复杂度
import {HashRouter as Router, Redirect, Route, Switch} from "react-router-dom";
import ChatRoom from "./views/ChatRoom";


class App extends React.Component {
    // constructor(props) {
    //     super(props);
    // }

    render() {
        return <Router>
            <Switch>
                <Route path={"/"} exact>
                    <Redirect to={"/login"}/>
                </Route>
                {/*登录界面*/}
                <Route path={"/login"} exact component={Login}>
                </Route>
                {/*聊天界面*/}
                <Route path={"/chatroom"} exact component={ChatRoom}>
                </Route>
            </Switch>
        </Router>
    }
}

export default App
