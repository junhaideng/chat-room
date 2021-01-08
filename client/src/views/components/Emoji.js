import React from 'react';
import {PropTypes} from "prop-types";
import "./Emoji.css"

// 表情管理
// 可以自定义加入一些表情，但是请保证这些表情在测试的时候可以完整的显示在界面中
// 添加表情之后注意一下样式，可能排版不均匀
// 表情可见：https://github.com/junhaideng/github-icons
class Emoji extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
        this.handleEmojiClick = this.handleEmojiClick.bind(this)
    }

    // 点击表情之后应该添加到输入框中
    handleEmojiClick(emoji) {
        this.props.handleEmojiClick(emoji)
    }

    render() {
        const emojis = ["😊", "😃", "😏", "😍", "😘", "😚", "😳", "😌", "😆", "😁", "😉", "😜", "😝", "😀", "😗", "😙", "😛", "😴", "😟", "😦", "😧", "😮", "😬", "😕", "😯", "😑", "😒", "😅", "😓", "😥", "😩", "😔", "😞", "😖", "😨", "😰", "😣", "😢", "😭", "😂", "😲", "😱", "😫", "😠", "😤", "😪", "😋", "😷", "😎", "😵", "👿", "😈", "😐", "😶", "👍", "👍", "👎", "👎", "👌", "👊", "👊", "✊", "✌", "👋", "✋", "✋", "👐", "☝", "👇", "👈", "👉", "🙌", "🙏", "👆", "👏", "💪", "🤘"]
        const items = emojis.map((value, index) => <li key={index} onClick={this.handleEmojiClick.bind(this, value)}
                                                       className={"chat-room-emoji-list-item"}>{value}</li>)
        return <>
            <div className="chat-room-emoji-list">
                {items}
            </div>
        </>
    }


}

Emoji.propTyps = {
    handleEmojiClick: PropTypes.func.isRequired
}

export default Emoji