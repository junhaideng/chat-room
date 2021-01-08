// 调试时使用, 打包时使用public中的electron.js
const {app, BrowserWindow, ipcMain, Menu} = require('electron')

const url = require('url')
const path = require("path")

let mainWindow = null;

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        // resizable:false,
        // maximizable:false,
        webPreferences: {
            // preload: path.join(__dirname, 'preload.js')
        },
        show:false,
        title: "chat room",
        icon: "./public/favicon.ico"
    })

    mainWindow.on('ready-to-show', ()=>{
        mainWindow.show()

        // 关闭菜单栏
        // Menu.setApplicationMenu(null)
        //关闭开发者工具
        // mainWindow.webContents.closeDevTools();
    })

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, './build/index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // 调试使用
    // 本地的https证书不适合
    // mainWindow.loadURL("http://localhost:3000/")

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

