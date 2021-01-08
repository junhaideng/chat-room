// 这里只是测试使用的数据

import logo from "../images/logo.svg";

export const message = [
    {
        type: "send",
        username: "Edgar",
        avatar: logo,
        date: new Date(),
        content: {
            type: "text",
            data: "send",
        }

    },
    {
        type: "receive",
        username: "Edgar",
        avatar: logo,
        date: new Date(),
        content: {
            type: "text",
            data: "receive",
        }
    },
    {
        type: "send",
        username: "Edgar",
        avatar: logo,
        date: new Date(),
        content: {
            type: "text",
            data: "send",
        }
    },
    {
        type: "send",
        username: "Edgar",
        avatar: logo,
        date: new Date(),
        content: {
            type: "text",
            data: "send",
        }
    },
    {
        type: "receive",
        username: "Edgar",
        avatar: logo,
        date: new Date(),
        content: {
            type: "text",
            data: "receive",
        }
    },
    {
        type: "receive",
        username: "Edgar",
        avatar: logo,
        date: new Date(),
        content: {
            type: "file",
            // 如果是文件那么需要指出它的类型以及名称
            data: {
                type: "pdf",
                filename: "xxx.pdf",
                filesize: "16.0MB"
            },
        }
    },
    {
        type: "send",
        username: "Edgar",
        avatar: logo,
        date: new Date(),
        content: {
            type: "file",
            data: {
                type: "word",
                filename: "xxx.docx",
                filesize: "18.0MB"
            },
        }
    },
    {
        type: "send",
        username: "Edgar",
        avatar: logo,
        date: new Date(),
        content: {
            type: "audio",
            data: {
                duration: "2\"",
                buffer: []
            },
        }
    },
    {
        type: "receive",
        username: "Edgar",
        avatar: logo,
        date: new Date(),
        content: {
            type: "audio",
            data: {
                duration: "2\"",
                buffer: []
            },
        }
    }
]