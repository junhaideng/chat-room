import React from 'react';
import {connect} from "react-redux";
import "./MemberList.css";
import {PropTypes} from "prop-types";
import {Badge} from "antd";
import {formatString} from "../../utils/tools";
import {setCurrent} from "../../redux/action/actions";

class MemberList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    // 点击某一个用户
    // 同时应该告诉ChatRoom组件当前选择的是哪一个用户，
    // 然后修改current状态值
    handleMemberClick(value, e) {
        const {setCurrent, setUnread} = this.props
        const items = document.querySelectorAll(".chat-room-group-members-item")
        for (let value of items) {
            value.className = "chat-room-group-members-item"
        }
        e.preventDefault()
        e.currentTarget.className = "chat-room-group-members-item active"
        setCurrent(value.username)
        setUnread(value.username)
    }

    render() {
        const {memberList, filter} = this.props
        console.log("memberList: ", memberList)

        let items;
        console.log("filter: ", filter.trim().length, filter.trim())
        if (filter.trim().length > 0) {
            items = memberList.map((value, index) =>
                value.username.indexOf(filter) >= 0 ?
                    <div className="chat-room-group-members-item" key={index + new Date()}
                         onClick={this.handleMemberClick.bind(this, value)}>
                        <div className="chat-room-group-members-item-avatar">
                            <img src={value.avatar} alt=""/>
                        </div>
                        <div className="chat-room-group-members-item-info" title={value.username}>
                            <Badge count={value.unread} offset={[10, 2]} dot>
                                {formatString(10, value.username)}
                            </Badge>
                        </div>

                    </div> : null
            )
        } else {
            items = memberList.map((value, index) =>
                <div className="chat-room-group-members-item" key={index}
                     onClick={this.handleMemberClick.bind(this, value)}>
                    <div className="chat-room-group-members-item-avatar">
                        <img src={value.avatar} alt=""/>
                    </div>
                    <div className="chat-room-group-members-item-info" title={value.username}>
                        <Badge count={value.unread} offset={[10, 2]} dot>
                            {formatString(10, value.username)}
                        </Badge>
                    </div>

                </div>
            )
        }

        return <>
            <div className={"chat-room-group-members"}>
                {items}
            </div>
        </>
    }
}

MemberList.propTypes = {
    memberList: PropTypes.array.isRequired,
    filter: PropTypes.string.isRequired,
    setUnread: PropTypes.func.isRequired
}

function mapDispatchToProps(dispatch) {
    return {
        setCurrent: (current) => dispatch(setCurrent(current))
    }
}


export default connect(null, mapDispatchToProps)(MemberList)