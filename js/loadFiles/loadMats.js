const { ipcRenderer } = require("electron");
const { fetch } = require("./config.js");
const fs = require("fs-extra");

function loadMats() {
    return new Promise((resolve, reject)=>{

        //Fetch the material folder
        fetch()
        .then(res=>{
            loadFiles(JSON.parse(res).filePath);
        })
        .catch(err=>{
            console.error(err);
            reject(error);
        })

        async function loadFiles(path) {
            try {
                var dir = await fs.readdir(path);
            } catch (error) {
                console.log(error);
                reject(error);
            }

            createCards(dir);
        }
    })

}


function createCards(titles) {

    var parent = document.querySelector("#program-wrapper > div.explorer-wrapper > div.browser.frontpage > div > div");

    for(let i = 0; i < titles.length; i++) {
        var el = document.createElement("div");
        el.className = "element";
        el.innerText = titles[i];
        parent.appendChild(el);
    }
}

module.exports = { loadMats };