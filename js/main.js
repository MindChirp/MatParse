const { loadMats, loadFiles } = require("../js/loadFiles/loadMats1");
const { ipcRenderer, electron, contextBridge, globalShortcut } = require("electron");
const { setupProgram } = require("../js/setup.js");
const { fetch } = require("../js/loadFiles/config");
const { changePreview } = require("../js/browser/previewHandler.js");
const { newNotification, newBannerNotification } = require("../js/notificationHandler");
const { handleResChange } = require("../js/browser/resolutionHandler.js");
const { copyDraggedFiles } = require("../js/loadFiles/copyFilesOnDrop.js");
const { showProgramInformation } = require("../js/programInfo.js");
const path = require("path");
const { contextMenuHandler, removeContextMenu } = require("../js/contextMenuHandler");
const Tags = require("../js/tagHandler");
const { searchMaterials } = require("../js/browser/searchHandler");
const settings = require("../js/settings/settings")
const keybinds = require("../js/keybindHandler");
//import { searchMaterials } from "./browser/searchHandler.mjs";

var dropFileModal = document.getElementById("drop-file-modal")

document.body.onload = async ()=>{
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

    //Load tags into the sidebar
    loadTags();

    //Load keyboard shortcuts
    keybinds.activatebinds();
}


function startLoading() {
    return new Promise((resolve, reject)=>{

        loadMats()
        .then(res=>{
            //Reload files
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

async function loadTags() {
    var par = document.querySelector(".side-bar .options .tags");

    var createdTags = par.querySelector(".created-tags");

    try {
        var tags = await Tags.loadAllTags();
    } catch (error) {
        newNotification("Could not load tags");
    }


    for(let i = 0; i < tags.length; i++) {
        var tag = document.createElement("div");
        tag.className = "tag";
        tag.innerHTML = /*'<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M435.25 48h-122.9a14.46 14.46 0 00-10.2 4.2L56.45 297.9a28.85 28.85 0 000 40.7l117 117a28.85 28.85 0 0040.7 0L459.75 210a14.46 14.46 0 004.2-10.2v-123a28.66 28.66 0 00-28.7-28.8z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path stroke="currentColor" fill="currentColor" d="M384 160a32 32 0 1132-32 32 32 0 01-32 32z"/></svg>*/'<span>' +tags[i]+ '</span>';

        tag.setAttribute("onclick", "handleTagEvent(this)");

        createdTags.querySelector(".tags").appendChild(tag);
    }

}



async function handleTagEvent(el) {
    var tag = el.getElementsByTagName("span")[0].innerText;

    var sel = document.querySelector(".browser .grid").getElementsByClassName("material selected");
    //Check selected elements

    if(sel.length >= 1) {
        //Add the tag to the selected elements
        for(let i = 0; i < sel.length; i++) {
            try {
                var allTags = await Tags.addTag(sel[i].fileName, tag);
                Tags.appendTags(allTags);
                newNotification("Tag added");
            } catch (error) {
                console.error(error);
                newNotification("Could not add " + tag + " tag");
            }
        }

    } else {
        //Search for the tag

        //It is possible to search for multiple tags at the same time
        //Get the tags that are searched for already
        var tags = document.querySelector("#top-tools .search > .search-bar-wrapper").getElementsByClassName("tag");

        if(tags.length >= 4) {
            newNotification("Maximum 4 tags");
            return;
        }

        var exists = false;
        for(let i = 0; i < tags.length; i++) {
            if(tags[i].innerText == tag) {exists=true; break;}
        }

        if(exists) return;

        var dom = document.createElement("span");
        dom.className = "tag";
        dom.innerText = tag;
        dom.setAttribute("title", "Click to remove");

        dom.addEventListener("click", (e)=>{
            var par = e.currentTarget.parentNode;
            e.currentTarget.parentNode.removeChild(e.currentTarget);

            var tags = par.getElementsByClassName("tag");

            //initiate new search with the tags
            var arr = [];
            for(let i = 0; i < tags.length; i++) {
                arr.push(tags[i].innerText.toLowerCase());
            }

            var term = par.querySelector("#search").value;

            searchMaterials(term, arr);

        })

        var par = document.querySelector("#top-tools .search > .search-bar-wrapper")

        par.insertBefore(dom, par.querySelector("#search"));


        //Update the tags list
        var tags = par.getElementsByClassName("tag");
        var arr = [];
        for(let i = 0; i < tags.length; i++) {
            arr.push(tags[i].innerText.toLowerCase());
        }
        //get the search query
        var term = par.querySelector("#search").value;

        searchMaterials(term.toString(), arr);

    }
}


var search = document.getElementById("search");
search.addEventListener("keydown", (e)=>{
    if(e.currentTarget.value.length > 0) return;
    var key =  e.keyCode
    if(key == 8) {
        //Check for the closest tag
        var tag = search.previousElementSibling;
        
        if(tag) {
            tag.parentNode.removeChild(tag)

            var term = e.currentTarget.value;
            var tags = e.currentTarget.parentNode.getElementsByClassName("tag");
            var arr = [];

            for(let i = 0; i < tags.length; i++) {
                arr.push(tags[i].innerText.toLowerCase());
            }


            searchMaterials(term, arr);
        }
    }
})


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

    //Get menu preview options
    var el = document.querySelector(".side-bar .options").getElementsByTagName("input")[preview];
    changePreview(el);

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


    var els = document.querySelector("#program-wrapper > div.explorer-wrapper > div.side-bar.frontpage > div.options-wrapper > div > div > div.resolution").getElementsByTagName("input");

    for(let i = 0; i < res.length; i++) {
        for(let m = 0; m < els.length; m++) {
            if(res[i] == els[m].id) {
                els[m].checked = true;
            }
        }
    }

    (async function(){
        var conf = JSON.parse(await fetch())
        //Set pin mode
        var pin = document.querySelector("#top-tools > div.right-side > div.stay-on-top-toggle > input");
        pin.checked = conf.stayOnTop;
        
    })();

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

ipcRenderer.on("app-path", (ev, dat)=>{
    localStorage.setItem("app-path", dat);
})



function addTag(e) {
    var inp = document.createElement("input");
    inp.type = "text";
    inp.className = "tag-name-input";

    var el = e.currentTarget;

    var b = el.cloneNode(true);

    el.parentNode.replaceChild(inp, el);

    inp.focus();




    inp.addEventListener("change", async (e)=>{

        var par = document.querySelector(".side-bar .options .tags");

        var createdTags = par.querySelector(".created-tags");

        var value = e.currentTarget.value;

        e.currentTarget.value = "";

        try {
            await Tags.createTag(value);
        } catch (error) {
            console.error(error);
            newNotification("Could not create tag");
        }

        try {
           var tags = await Tags.loadAllTags();
        } catch (error) {
            console.error(error);
            newNotification("Could not load tags");
        }

        createdTags.querySelector(".tags").innerHTML = "";

        for(let i = 0; i < tags.length; i++) {
            var tag = document.createElement("div");
            tag.className = "tag";
            tag.innerHTML = /*'<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M435.25 48h-122.9a14.46 14.46 0 00-10.2 4.2L56.45 297.9a28.85 28.85 0 000 40.7l117 117a28.85 28.85 0 0040.7 0L459.75 210a14.46 14.46 0 004.2-10.2v-123a28.66 28.66 0 00-28.7-28.8z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path stroke="currentColor" fill="currentColor" d="M384 160a32 32 0 1132-32 32 32 0 01-32 32z"/></svg>*/'<span>' +tags[i]+ '</span>';
    
            tag.setAttribute("onclick", "handleTagEvent(this)");
            createdTags.querySelector(".tags").appendChild(tag);
        }

    })


    inp.addEventListener("blur", ()=>{
        inp.parentNode.replaceChild(b, inp);
    })

}


function searchForTerm(term) {
    var tags = document.querySelector("#top-tools .search > .search-bar-wrapper").getElementsByClassName("tag");
    var arr = [];
    for(let i = 0; i < tags.length; i++) {
        arr.push(tags[i].innerText.toLowerCase())
    }

    searchMaterials(term, arr);
}

async function togglePinMode() {
    try {
        var conf = JSON.parse(await fetch());
    } catch (error) {
        console.error(error);
        newNotification("Could not toggle pin mode");
        return;
    }

    var state = conf.stayOnTop;
    state=state?false:true;

    setPinnedToTop(state);

    //Update pin symbol
    document.querySelector("#stay-on-top").checked = state;

}

function toggleGridMode() {
    //Get grid mode
    var inps = document.querySelector("#top-tools > div.right-side > div.compressed-toggle");
    inps = inps.getElementsByTagName("input");
    if(inps[0].checked) {
        inps[1].checked = true;
        inps[0].checked = false;
        handleGridType("wide");
        
    } else if(inps[1].checked) {
        inps[0].checked = true;
        inps[1].checked = false;
        handleGridType("compressed");

    }

}

async function setPinnedToTop(state) {
    if(typeof state != "boolean") return;

    //fetch config
    var config = await ipcRenderer.invoke("fetch-config", "");
    config = JSON.parse(JSON.parse(config));
    if(!config) {
        newNotification("Could not change pin mode");
        return;
    }
    config.stayOnTop = state;
    //save config
    try {
        var res = await ipcRenderer.invoke("save-config", JSON.stringify(config));
    } catch (error) {
        console.error(error);
    }
    
}


function loadKeyCuts() {
    
}


function openSettings() {
    settings.open();
}