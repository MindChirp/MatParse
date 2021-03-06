const { ipcRenderer } = require("electron");
const fs = require("fs-extra");
const path = require("path");
const { fetchMaterialConfig, fetch } = require("../loadFiles/config");
const { dragMaterialOut } = require("../browser/dragMaterialHandler");
const { newNotification } = require("../notificationHandler");
const Tags = require("../../js/tagHandler");

var materialPath;

function createMaterial(material) {
    return new Promise(async (resolve, reject)=>{
        var filePath = material;
        if(!materialPath) {
            materialPath = JSON.parse(await fetch()).filePath;
        }

        var noConfig = false;

        //Load the file config
        try {
            var config = JSON.parse(await fs.readFile(path.join(materialPath, material, "configs", "materialConfig.json"), "utf8"));
        } catch (error) {
            //Could not load file
            noConfig = true;
        }

        var parent = document.querySelector("#program-wrapper > div.explorer-wrapper > div.browser.frontpage > div.scroller > div.grid");

        var el = document.createElement("div");
        el.className = "element material cls-context-menu";
        el.fileName = filePath;
        el.title = filePath;
        if(material.includes(".zip")) reject();
        
        if(noConfig) {
            var warn = document.createElement("span");
            warn.className = "element-warning";
            warn.innerText = "Please readd";
            el.appendChild(warn);
            var svg = document.createElement("svg");
            svg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Warning</title><path d="M85.57 446.25h340.86a32 32 0 0028.17-47.17L284.18 82.58c-12.09-22.44-44.27-22.44-56.36 0L57.4 399.08a32 32 0 0028.17 47.17z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path d="M250.26 195.39l5.74 122 5.73-121.95a5.74 5.74 0 00-5.79-6h0a5.74 5.74 0 00-5.68 5.95z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path stroke="currentColor" fill="currentColor" d="M256 397.25a20 20 0 1120-20 20 20 0 01-20 20z"/></svg>';
            
            warn.addEventListener("click", ()=>{
                alert("This material does not have a config. This means that we cannot fetch the resolutions, timestamps or any other associated data with this entry. It is possible to drag this material into your game maker engine, but we recommend readding the material to the program.")
            })

            warn.appendChild(svg);
        }

        el.setAttribute("draggable", "true");

        el.addEventListener("dragstart", async (e)=>{
            //Drag initiated

            e.preventDefault();

            //Move the drag processing into appropriate module
            try {
                var list = await dragMaterialOut(e.currentTarget);
            } catch (error) {
                console.error(error);
                newNotification("Select a resolution");
                return;
            }


            dropFileModal = document.querySelector("#drop-file-modal");
            dropFileModal.classList.add("prevent-display");

            ipcRenderer.send("ondragstart", list);

        })

        var img = document.createElement("img");
        img.className = "preview-image";

        var title = document.createElement("span");
        title.className = "title";
        title.innerText = filePath;

        var resCont = document.createElement("div");
        resCont.className = "resolutions";
        el.appendChild(resCont);

        if(!noConfig) {
            config.resolutions = config.resolutions || ["UNKNOWN"];
            var resolutions = config.resolutions;
            for(let i = 0; i < resolutions.length; i++) {
                var res = document.createElement("span");
                res.className = "res";
                res.innerText = resolutions[i];
                resCont.appendChild(res);   
            }
        }

        var selectFunction = function(e){
            console.log(e);
            if(!e.ctrlKey && !e.shiftKey) {
                //Deselect every other element    

                this.classList.toggle("selected");
                //Check if it contains selected
                var isSel = this.classList.contains("selected");

                var sel = document.querySelector(".browser .grid").getElementsByClassName("material selected");
                var len = sel.length;
                for(let i = 0; i < len; i++) {
                    sel[0].classList.remove("selected");
                }

                if(isSel) {
                    this.classList.add("selected");
                }

            } else {
                this.classList.toggle("selected");

            }

            updateTags();
        }

        el.select = selectFunction;

        el.setAttribute("onclick", "this.select(event)");

        //Set an image source
        //CHECKPOINT

        el.appendChild(img);
        el.appendChild(title);

        var paths = [
            ["_preview2", "_Cube"],
            ["_preview1", "_Sphere"],
            ["_flat", "_Flat"]
        ];


        //get the config
        var conf = JSON.parse(localStorage.getItem("preview")).type;
        conf = conf || 0;
        var _img;

        var z = 0;
        await loop();
        async function loop() {
            try {
                _img = await fs.readFile(path.join(materialPath, filePath, "Previews", filePath + paths[conf][z] + ".jpg"));
            } catch (error) {
                //console.log(error);
                if(z < paths[conf].length-1) {
                    z++
                    await loop();
                }
            }
        }


        var hasImage = true;
        if(!_img) {
            hasImage = false;
        };

        if(hasImage) {
            var src = "data:image/png;base64," + _img.toString("base64");
            
            img.src = src;
        } else {

            var icon = document.createElement("div");
            img.parentNode.replaceChild(icon, img);
            icon.className = "no-image";

            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Image</title><rect x="48" y="80" width="416" height="352" rx="48" ry="48" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32"/><circle cx="336" cy="176" r="32" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"/><path d="M304 335.79l-90.66-90.49a32 32 0 00-43.87-1.3L48 352M224 432l123.34-123.34a32 32 0 0143.11-2L464 368" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>';
        }

        parent.appendChild(el);


        resolve(el);
    })

}





function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }

    return false;
}


async function updateTags() {
    //get selected materials
    var par = document.querySelector(".side-bar .options > .tags > .current-tags");
    var sel = document.querySelector(".browser .grid").getElementsByClassName("material selected");

    if(sel.length == 1) {
       var tags = await Tags.loadTags(sel[0].fileName);
        
       //Add tags to the sidebar
       Tags.appendTags(tags);
    } else if(sel.length == 0) {
        //Remove
        par.innerHTML = "";
    } else if(sel.length > 1) {
        par.innerHTML = "";
    }
}

module.exports = { createMaterial };