const { loadMats, loadFiles } = require("../js/loadFiles/loadMats");
const { ipcRenderer, electron } = require("electron");
const { setupProgram } = require("../js/setup.js");
const { fetch } = require("../js/loadFiles/config");
const { changePreview } = require("../js/browser/previewHandler.js");
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
}

function startLoading() {
    loadMats()
    .then(res=>{
        //Reload files
        console.log(res);
        fetch()
        .then(res=>{
            //loadFiles(JSON.parse(res).filePath);
        })
    })
    .catch(err=>{
        console.error(err);
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
}