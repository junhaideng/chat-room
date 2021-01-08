import {message} from "antd";

// 检查是否支持媒体设备
export function checkSupport() {
    if (!navigator.mediaDevices) {
        message.info("当前环境不支持该功能")
        return false
    }
    return true
}

// 字符串类型太长，进行截断处理
export function formatString(len, value) {
    if (!value || value.length <= len) {
        return value
    }
    if (value.length > len) {
        return value.slice(0, len) + "…"
    }
}

export const GroupPrefix = "【群聊】"

// 判断是否是群组
export function isGroup(value) {
    return value.indexOf(GroupPrefix) >= 0;
}

// 拷贝map类型数据，否则设置了state，组件也不更新！
export function copyMap(map) {
    let temp = new Map()
    for (let key of map.keys()) {
        temp.set(key, [...map.get(key)])
    }
    return temp
}