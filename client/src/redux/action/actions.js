// 定义函数来生成 Action

import {
    GET_AVATAR,
    GET_CHAT_ROOM,
    GET_CURRENT,
    GET_LOGIN,
    GET_USERNAME,
    RESET,
    SET_AVATAR,
    SET_CHAT_ROOM,
    SET_CURRENT,
    SET_LOGIN,
    SET_USERNAME
} from "./action-types";

export function setCurrent(current) {
    return {
        type: SET_CURRENT,
        payload: current
    }
}

export function getCurrent() {
    return {
        type: GET_CURRENT,
    }
}

export function setUsername(username) {
    return {
        type: SET_USERNAME,
        payload: username
    }
}

export function getUsername() {
    return {
        type: GET_USERNAME,
    }
}

export function setChatRoom(room) {
    return {
        type: SET_CHAT_ROOM,
        payload: room
    }
}

export function getChatRoom() {
    return {
        type: GET_CHAT_ROOM,
    }
}

export function setAvatar(avatar) {
    return {
        type: SET_AVATAR,
        payload: avatar
    }
}

export function getAvatar() {
    return {
        type: GET_AVATAR
    }
}

export function setLogin(flag) {
    return {
        type: SET_LOGIN,
        payload: flag
    }
}

export function getLogin() {
    return {
        type: GET_LOGIN
    }
}

export function reset() {
    return {
        type: RESET
    }
}