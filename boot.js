const { BrowserWindow, app, ipcMain, dialog } = require("electron");
var win;

function bootWindow() {
    win = new BrowserWindow({
        frame: false,
        transparent: true,
        height: 800,
        width: 900,
        maxHeight: 800,
        maxWidth: 900,
        minHeight: 400,
        minWidth: 500,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            backgroundThrottling: false
        },
        
    });

    win.setAlwaysOnTop(true, "screen-saver");

    win.loadFile("./htmls/home.html");

    win.webContents.on("did-finish-load", (ev)=>{
        //Loaded
        win.show();
    })

    //Do this if developer
    //if(process.env.NODE_ENV == "developer") {
        devToolsWin = new BrowserWindow();
        win.webContents.setDevToolsWebContents(devToolsWin.webContents);
        win.webContents.openDevTools({ mode: 'detach' })
    //}
}

app.on("ready", ()=>{
    bootWindow();
})