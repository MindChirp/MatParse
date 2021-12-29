const { BrowserWindow, app, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');

const validFiles = require("./validateFiles.js");
const dotenv = require("dotenv");
dotenv.config();
//Define paths
const appPath = app.getPath("userData");

var win;
var devToolsWin;

app.setAppUserModelId('MineTrack');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

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
            backgroundThrottling: false,
            preload: path.join(__dirname, "preload.js")
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

        autoUpdater.checkForUpdates();
    })

    //Do this if developer
    if(process.env.NODE_ENV == "dev") {
        devToolsWin = new BrowserWindow();
        win.webContents.setDevToolsWebContents(devToolsWin.webContents);
        win.webContents.openDevTools({ mode: 'detach' })
    }
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

ipcMain.handle("close-program", (ev, arg)=>{
    if(devToolsWin) {
        devToolsWin.close();
    }
    win.close();
})

ipcMain.handle("minimize-program", (ev, arg)=>{
    if(devToolsWin) {
        devToolsWin.minimize();
    }
    win.minimize();
})




app.on("ready", ()=>{
    bootWindow();
})



//Handle auto updating

ipcMain.handle("check-for-update", async (ev)=>{
    autoUpdater.checkForUpdates();
    return true;
})

autoUpdater.on("update-available", (ev)=>{
    win.webContents.send("update-information", JSON.stringify(ev));
})

ipcMain.handle("download-update", async (ev)=>{
    autoUpdater.downloadUpdate();
    return true
})

autoUpdater.on("download-progress", (ev)=>{
    console.log(ev);
    win.webContents.send("update-progress", JSON.stringify(ev));
})

autoUpdater.on("update-downloaded", (ev)=>{
    console.log(ev);
    win.webContents.send("update-downloaded", JSON.stringify(ev));
})

ipcMain.handle("restart-install", (ev)=>{
    autoUpdater.quitAndInstall();
    return true;
})


const iconName = path.join(__dirname, "tree.jpg");
console.log(iconName)
//const icon = fs.createReadStream(iconName);
//fs.writeFileSync(path.join(__dirname, 'drag-and-drop.md'), '# First file to test drag and drop')
//Handle file dragging
ipcMain.on("ondragstart", (ev, filePath)=>{

    try {
        ev.sender.startDrag({
            file: filePath[0],
            icon: iconName
        })
    } catch (error) {
        console.error(error);
    }
    


})