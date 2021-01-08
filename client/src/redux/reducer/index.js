/*
 * 全局状态管理
 */

import {combineReducers} from "redux";

import {
    GET_AVATAR,
    GET_CHAT_ROOM,
    GET_CURRENT,
    GET_LOGIN,
    GET_USERNAME,
    SET_AVATAR,
    SET_CHAT_ROOM,
    SET_CURRENT,
    SET_LOGIN,
    SET_USERNAME
} from "../action/action-types";


const username = function (state = "", action) {
    switch (action.type) {
        case GET_USERNAME:
            return state
        case SET_USERNAME:
            return action.payload
        default:
            return state
    }
}

const chatRoom = function (state = "", action) {
    switch (action.type) {
        case GET_CHAT_ROOM:
            return state
        case SET_CHAT_ROOM:
            return action.payload
        default:
            return state
    }
}

const avatar = function (state = "", action) {
    switch (action.type) {
        case GET_AVATAR:
            return state
        case SET_AVATAR:
            return action.payload
        default:
            return state
    }
}

const current = function (state = "", action) {
    switch (action.type) {
        case GET_CURRENT:
            return state
        case SET_CURRENT:
            return action.payload
        default:
            return state
    }
}

const login = function (state = false, action) {
    switch (action.type) {
        case GET_LOGIN:
            return state
        case SET_LOGIN:
            return action.payload
        default:
            return state
    }
}

export default combineReducers({
    username,
    chatRoom,
    avatar,
    current,
    login
})