import React from "react";
import {PropTypes} from "prop-types";
import {DeleteOutlined, FileImageOutlined, FileOutlined} from "@ant-design/icons";
import "./FilePreviewIcon.css";
import {Tooltip} from "antd";

class FilePreviewIcon extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            preview: null,
            type: "",
        }

        this.handleDeleteClick = this.handleDeleteClick.bind(this)
    }

    // 更新state
    static getDerivedStateFromProps(props, state) {
        if (props.type !== state.type) {
            if (props.type === null) {
                return null
            }
            let preview;
            let type;
            if (/image.*?/.test(props.type)) {
                type = "image"
            }
            switch (type) {
                case 'image':
                    preview = <FileImageOutlined/>
                    break
                default:
                    preview = <FileOutlined/>
            }

            return {
                preview: preview,
                type: type
            }
        }
        return null
    }

    handleDeleteClick() {
        console.log(this.props)
        this.props.deleteFile()
    }


    render() {
        return <>
            <div className="chat-room-message-editor-preview">
                <div className={"chat-room-message-editor-preview-icon"}>
                    {this.state.preview}
                </div>
                <div className={"chat-room-message-editor-preview-filename"}>
                    {this.props.filename.length > 10 ? this.props.filename.slice(0, 10) + "..." : this.props.filename}
                </div>
                <div className={"chat-room-message-editor-preview-delete"}>
                    <Tooltip title={"删除文件"}>
                        <DeleteOutlined onClick={this.handleDeleteClick}/>
                    </Tooltip>
                </div>
            </div>
        </>
    }
}

FilePreviewIcon.propTypes = {
    type: PropTypes.string,
    filename: PropTypes.string,
    deleteFile: PropTypes.func
}

export default FilePreviewIcon