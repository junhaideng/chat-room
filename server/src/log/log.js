
const log = (type, ...data)=>{
    const date = new Date();
    let prefix = `[${type}] ${date.getFullYear()}-${date.getMonth()}-${date.getDay()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    console.log(prefix, ...data)
}

const INFO = "INFO"
const WARNING = "WARNING"
const ERROR = "ERROR"
const DEBUG = "DEGUG"

module.exports = {
    log,
    INFO,
    WARNING, 
    ERROR,
    DEBUG
}