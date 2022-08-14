const { BrowserWindow, app, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');

const validFiles = require("./validateFiles");
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

    win.setAlwaysOnTop(true);

    win.loadFile("./htmls/home.html");

    try {
        var res = await validFiles.validate(appPath);
    } catch (error) {
        console.log(error);
    }
    
    win.webContents.on("did-finish-load", async (ev)=>{
        //Loaded
        await win.webContents.send("program-state", JSON.stringify(res))
        await win.webContents.send("app-path", appPath)
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


function applyConfig(config) {
    if(win) {
        win.setAlwaysOnTop(config.stayOnTop);
    }
}

ipcMain.handle("save-config", async (ev, arg)=>{
    console.log(typeof JSON.parse(arg));
    if(typeof JSON.parse(arg) != "object") return "Must be an object";
    
    try {
        await fs.writeFile(path.join(appPath, "userdata", "config.json"), JSON.stringify(arg))
        applyConfig(JSON.parse(arg));
        return "OK";
    } catch (error) {
        return error+'';
    }
    
})

ipcMain.handle("fetch-config", async (ev, arg)=>{
    try {
        var file = await fs.readFile(path.join(appPath, "userdata", "config.json"), "utf8");
    } catch (error) {
        return false;
    }

    return file;

})



ipcMain.handle("get-app-path", async (ev, arg)=>{
    return appPath;
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
    checkFiles();
    bootWindow();
})





//Check if all nescessary files are present
function checkFiles() {
    //Read appdata dir
    fs.readdir(appPath, async (err, dat)=>{
        if(err) {
            console.log("COULD NOT VERIFY PROGRAM FILES");
            console.error(err);
        }


        console.log(dat);
        if(!dat.includes("importprofiles")) {
            //Copy over the includes profile file
            try {
                await fs.copy("./importprofiles", path.join(appPath, "importprofiles"));
            } catch (error) {
                console.error(error);
                console.log("COULD NOT COPY NESCESSARY FILES");
            }
        }
    })
}


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
            files: filePath,
            icon: iconName
        })
    } catch (error) {
        console.error(error);
    }
})


ipcMain.handle("open-folder-selection", async (ev)=>{
    var result = await dialog.showOpenDialog(win, {
        properties: ['openFile', 'multiSelections'],
        filters:[
            {name: 'Archives', extensions: ["zip"]}
        ]
    })
    return result.filePaths;
})


ipcMain.handle("open-folder-path", async (ev, dat)=>{
    require('child_process').exec('start "" "' + dat, '"');
})