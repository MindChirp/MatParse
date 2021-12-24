const { BrowserWindow, app, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const validFiles = require("./validateFiles.js");
//Define paths
const appPath = app.getPath("userData");

var win;



//Program has started, check for files etc

async function bootWindow() {
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

    try {
        var res = await validFiles.validate(appPath);
    } catch (error) {
        console.log(error);
    }
    
    win.webContents.on("did-finish-load", async (ev)=>{
        //Loaded
        await win.webContents.send("program-state", JSON.stringify(res))
        win.show();
    })

    //Do this if developer
    //if(process.env.NODE_ENV == "developer") {
        devToolsWin = new BrowserWindow();
        win.webContents.setDevToolsWebContents(devToolsWin.webContents);
        win.webContents.openDevTools({ mode: 'detach' })
    //}
}

ipcMain.handle("path-modal", async (ev, arg)=>{
    var result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory']
    })
    return result.filePaths;
})

ipcMain.handle("save-config", (ev, arg)=>{
    console.log(typeof JSON.parse(arg));
    if(typeof JSON.parse(arg) != "object") return "Must be a object";
    fs.writeFile(path.join(appPath, "userdata", "config.json"), JSON.stringify(arg))
    .then(()=>{
        return "OK";
    })
    .catch(err=>{
        return err+'';
    })
})

ipcMain.handle("fetch-config", async (ev, arg)=>{
    try {
        var file = await fs.readFile(path.join(appPath, "userdata", "config.json"), "utf8");
    } catch (error) {
        return false;
    }

    return file;

})




app.on("ready", ()=>{
    bootWindow();
})
