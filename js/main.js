const { loadMats, loadFiles } = require("../js/loadFiles/loadMats1");
const { ipcRenderer, electron, contextBridge } = require("electron");
const { setupProgram } = require("../js/setup.js");
const { fetch } = require("../js/loadFiles/config");
const { changePreview } = require("../js/browser/previewHandler.js");
const { newNotification, newBannerNotification } = require("../js/notificationHandler");
const { handleResChange } = require("../js/browser/resolutionHandler.js");
const { copyDraggedFiles } = require("../js/loadFiles/copyFilesOnDrop.js");
const { showProgramInformation } = require("../js/programInfo.js");
const path = require("path");
const { contextMenuHandler, removeContextMenu } = require("../js/contextMenuHandler");

const { searchMaterials } = require("../js/browser/searchHandler");
//import { searchMaterials } from "./browser/searchHandler.mjs";

var dropFileModal;

document.body.onload = ()=>{
    ipcRenderer.on("program-state", (ev, dat)=>{
        var data = JSON.parse(dat);
        if(data.new) {
            //Launch into setup mode
            setupProgram()
            .then(()=>{
                startLoading();
            })
        } else {
            startLoading();
        }
    })


    //Check window size type
    handleSizeType();
    setMenuOptions();

    //Register file dragging events
    registerFileDraggingEvents();

    dropFileModal = document.querySelector("#drop-file-modal");
}

function startLoading() {
    return new Promise((resolve, reject)=>{

        loadMats()
        .then(res=>{
            //Reload files
            console.log(res);
            fetch()
            .then(async res=>{
                await loadFiles(JSON.parse(res).filePath);
                resolve();
            })
        })
        .catch(err=>{
            console.error(err);
            reject(err);
        })
    })

}


window.addEventListener("resize", (e)=>{
    //Get the sizes of the window
    handleSizeType();

})

function handleSizeType() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    if(w <= 761 && !document.body.classList.contains("small")) {
        document.body.classList.add("small");
    } else if(w > 761 && document.body.classList.contains("small")) {
        document.body.classList.remove("small");
    }
}



function setMenuOptions() {
    //get the preview type

    try {
        var preview = JSON.parse(localStorage.getItem("preview")).type;
    } catch (error) {
        console.log(error);
    }
    preview = preview || 0;

    var par = document.querySelector("#program-wrapper > div.explorer-wrapper > div.side-bar.frontpage > div.options-wrapper > div > div > div > form");

    par.getElementsByTagName("input")[preview].checked = true;

    //set the resolutions
    try {
        var res = JSON.parse(localStorage.getItem("localConfig")).resolutions;
    } catch (error) {
        console.log(error);
        localStorage.setItem("localConfig", JSON.stringify({resolutions:["2K"]}));
    }

    res = res || ["2K"];

    console.log(res);

    var els = document.querySelector("#program-wrapper > div.explorer-wrapper > div.side-bar.frontpage > div.options-wrapper > div > div > div.resolution").getElementsByTagName("input");

    for(let i = 0; i < res.length; i++) {
        for(let m = 0; m < els.length; m++) {
            if(res[i] == els[m].id) {
                els[m].checked = true;
            }
        }
    }
}


function closeProgram() {
    ipcRenderer.invoke("close-program", "");
}

function minimizeProgram() {
    ipcRenderer.invoke("minimize-program", "");
}

var counter = 0;

function registerFileDraggingEvents() {
    document.addEventListener("dragenter", dragEnterHandler);
    document.addEventListener("dragover", dragOverHandler);
    document.addEventListener("drop", dropFileHandler);


    document.addEventListener("mouseleave", (ev)=>{
    })
}

function dragLeaveHandler() {
    counter--
    if(counter == 0) {
        dropFileModal.classList.remove("prevent-display");
        dropFileModal.classList.remove("display");   
    }
}


function dragOverHandler(e) {
    e.preventDefault();
}


function dragEnterHandler(e) {
    e.preventDefault();
    console.log(counter);
    counter++
    if(!dropFileModal.classList.contains("display")) {
        dropFileModal.classList.add("display");
        document.addEventListener("dragleave", dragLeaveHandler);       

    }
}

function dropFileHandler(e) {
    var copyFiles = [];
    counter = 0;
    dropFileModal.classList.remove("display");

    e.preventDefault();
    e.stopPropagation();
    for (const f of e.dataTransfer.files) {
        // Using the path attribute to get absolute file path
        
        //Check if the selected items are archives
        if(f.name.toString().indexOf(".zip") != -1) {
            //Is a zip
            copyFiles.push({path: f.path, name: f.name})
        }

      }

      if(copyFiles.length == 0) {newNotification("No archives found"); return;}

      var par = document.querySelector("#program-wrapper > div.explorer-wrapper > div.browser.frontpage > div.scroller");
      var loader = document.createElement("span");
      loader.className = "file-loading-indication";
      loader.innerText = "Loading content";
      loader.remove = function() {
          console.log(this);
          this.parentNode.removeChild(this);
      }
      par.appendChild(loader)


      //start copying over files etc
        copyDraggedFiles(copyFiles)
        .then(res=>{
            startLoading()
            .then(res=>{
                loader.remove();
            })
            .catch(err=>{
                loader.remove();

            })
        })
        .catch(err=>{
            newNotification("Could not load the files");
            loader.remove();
            console.error(err);
        })



}


function checkForUpdates() {
    ipcRenderer.invoke("check-for-update", "");
    newNotification("Checking for updates");
}

ipcRenderer.on("update-information", (ev, args)=>{
    var dat = JSON.parse(args);
    newBannerNotification("A new update is available - <ver>" + dat.version + "</ver>", {persistent: true, buttons: [
        {value: "Install", click: "installUpdate()", close: true}
    ]});
})


async function installUpdate() {
    newNotification("Downloading update..");
    ipcRenderer.invoke("download-update","")
}

function updateBarPercentage(dat) {
    var perc = dat.percent;

    //get the full width of the main bar

    var bar = document.getElementById("download-progress");
    var box = bar.querySelector(".bar");
    
    box.style.width = perc + "%";

}

ipcRenderer.on("update-progress", function(ev, dat){
    var d = dat;
    console.log(d);
    updateBarPercentage(JSON.parse(dat));
})

ipcRenderer.on("update-downloaded", function(ev, dat){
    newBannerNotification("Updates has been downloaded.", {persistent: true, buttons: [
        {value: "Restart", click: "restartApplyUpdate()", close: true}
    ]});
})

function restartApplyUpdate() {
    ipcRenderer.invoke("restart-install", "");
}


function handleGridType(type) {
    var par = document.body.querySelector(".browser.frontpage");
    if(type == "compressed") {
        if(!par.classList.contains("compressed")) {
            par.classList.add("compressed");
        } 
    } else if(type == "wide") {
        if(par.classList.contains("compressed")) {
            par.classList.remove("compressed");
        } 
    }
} 




async function addFilesFromButton() {
    //Open file modal
    var archives = [];

    var paths = await ipcRenderer.invoke("open-folder-selection", "");
    if(paths.length == 0) {newNotification("No folders selected"); return;}
    
    for(let i = 0; i < paths.length; i++) {
        var obj = {path: paths[i], name: path.basename(paths[i])};
        archives.push(obj);
    }


    
    var par = document.querySelector("#program-wrapper > div.explorer-wrapper > div.browser.frontpage > div.scroller");
    var loader = document.createElement("span");
    loader.className = "file-loading-indication";
    loader.innerText = "Loading content";
    loader.remove = function() {
        console.log(this);
        this.parentNode.removeChild(this);
    }
    par.appendChild(loader)

    copyDraggedFiles(archives)
    .then(res=>{
        startLoading()
        .then(res=>{
            loader.remove();
        })
        .catch(err=>{
            console.error(err);
            newNotification("Could not load files");
        })
    })
    .catch(err=>{
        newNotification("Could not parse files");
        console.error(err);
    })
}