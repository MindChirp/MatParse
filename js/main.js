const { loadMats, loadFiles } = require("../js/loadFiles/loadMats");
const { ipcRenderer, electron } = require("electron");
const { setupProgram } = require("../js/setup.js");
const { fetch } = require("../js/loadFiles/config");
const { changePreview } = require("../js/browser/previewHandler.js");
const { newNotification, newBannerNotification } = require("../js/notificationHandler");
const { handleResChange } = require("../js/browser/resolutionHandler.js");
const { copyDraggedFiles } = require("../js/loadFiles/copyFilesOnDrop.js");
const { showProgramInformation } = require("../js/programInfo.js");

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

    var preview = JSON.parse(localStorage.getItem("preview")).type;

    var par = document.querySelector("#program-wrapper > div.explorer-wrapper > div.side-bar.frontpage > div.options-wrapper > div > div > div > form");

    par.getElementsByTagName("input")[preview].checked = true;

    //set the resolutions
    var res = JSON.parse(localStorage.getItem("localConfig")).resolutions;

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

function registerFileDraggingEvents() {
    document.addEventListener("dragover", dragOverHandler);
    document.addEventListener("drop", dropFileHandler);
}

function dragLeaveHandler() {
    dropFileModal.classList.remove("display");
}



function dragOverHandler(e) {
    e.preventDefault();
    if(!dropFileModal.classList.contains("display")) {
        dropFileModal.classList.add("display");
        dropFileModal.addEventListener("dragleave", dragLeaveHandler);

    }
}

function dropFileHandler(e) {

    var copyFiles = [];

    e.preventDefault();
    e.stopPropagation();
    for (const f of e.dataTransfer.files) {
        // Using the path attribute to get absolute file path
        
        //Check if the selected items are archives
        console.log(f)
        if(f.name.toString().indexOf(".zip") != -1) {
            //Is a zip
            copyFiles.push({path: f.path, name: f.name})
        }

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



      dropFileModal.classList.remove("display");
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