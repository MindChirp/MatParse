const { loadMats } = require("../js/loadFiles/loadMats");
const { ipcRenderer, electron } = require("electron");
const { setupProgram } = require("../js/setup.js");


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
}

function startLoading() {
    loadMats();
}