const { loadMats, loadFiles } = require("../js/loadFiles/loadMats");
const { ipcRenderer, electron } = require("electron");
const { setupProgram } = require("../js/setup.js");
const { fetch } = require("../js/loadFiles/config");
const { changePreview } = require("../js/browser/previewHandler.js");
const { newNotification } = require("../js/notificationHandler");
const { handleResChange } = require("../js/browser/resolutionHandler.js");
const { copyDraggedFiles } = require("../js/loadFiles/copyFilesOnDrop.js");

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
            loader.remove();
            console.error(err);
        })



      dropFileModal.classList.remove("display");
}


ipcRenderer.on("update-information", (ev, args)=>{
    console.log(args);
    alert("NEW UPDATE")
})