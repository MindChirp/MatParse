const { ipcRenderer } = require("electron");
const { fetchMaterialConfig, fetch } = require("../js/loadFiles/config");
const path = require("path");
const { fstat } = require("fs");
var materialPath;
const fs = require("fs-extra");
const { newNotification } = require("./notificationHandler");

async function contextMenuHandler(e) {

    if(!materialPath) {
        materialPath = JSON.parse(await fetch()).filePath;
    }

    var ctx = document.getElementById("context-menu");

    var el = e.target

    if(!el.closest(".cls-context-menu")) {ctx.style.display = "none"; return;};

    //get position of click
    var x = e.clientX;
    var y = e.clientY;


    if(el.closest(".cls-context-menu").classList.contains("material")) {
        var content = await materialCtx(el.closest(".cls-context-menu"));
        ctx.innerHTML = "";
        ctx.appendChild(content);
    }

    ctx.style.display = "block";


    //Map the possible ways to place the element
    var pos = {top: false, right: false, bottom: false, left: false};
    var rect = ctx.getBoundingClientRect();

    //Window sized
    var h = window.innerHeight
    var w = window.innerWidth;
    
    //Check for top
    var tEdge = y;
    if(tEdge >= 0) {
        pos.top = true;
    }

    //Check for right
    var rEdge = x + rect.width;
    if(rEdge <= w) {
        pos.right = true;
    }

    //Check for bottom
    var bEdge = y + rect.height;
    if(bEdge <= h) {
        pos.bottom = true;
    }

    //Check for left
    var lEdge = x;
    if(lEdge >= 0) {
        pos.left = true;
    }


    ctx.style.top = y + "px";
    ctx.style.left = x + "px";

    if(!pos.right) {
        ctx.style.left = (x - rect.width) + "px"
    }

    if(!pos.bottom) {
        ctx.style.top = "auto";
        ctx.style.bottom = (y - rect.height) + "px"
    }


}

function removeContextMenu() {
    var ctx = document.getElementById("context-menu");
    ctx.style.display = "none";
}


async function materialCtx(el) {

    var conf = await fetchMaterialConfig(el.fileName);
    console.log(conf);
    var ratio = conf.aspectRatio || "No data";

    var divide = conf.dimensions.x / conf.dimensions.y;

    var backup = Math.round((1 * divide)) + ":" + 1;

    var wr = document.createElement("div");
    wr.className = "wrapper";

    var asp = document.createElement("div");
    asp.className = "emphasis";

    var aspWr = document.createElement("div");
    aspWr.className = "wrapper";
    asp.appendChild(aspWr);

    var t = document.createElement("span");
    t.innerText = ratio;
    
    
    var t1 = document.createElement("span");
    t1.innerText = backup;
    t1.style = `
        opacity: 0.5;
        font-size: 0.8rem;
        margin-left: 0.3rem;
    `

    aspWr.appendChild(t);
    aspWr.appendChild(t1);

    wr.appendChild(asp);

    var bs = document.createElement("div");
    bs.className = "nominal";

    wr.appendChild(bs);


    var del = document.createElement("button");
    del.innerText = "Delete";
    bs.appendChild(del);

    del.addEventListener("click", ()=>{
        var str = path.join(materialPath, el.fileName);
        try {
            fs.rm(str, {recursive: true});
        } catch (error) {
            console.error(error);
            newNotification("Could not delete material");
        }

        el.parentNode.removeChild(el);


    })

    var folder = document.createElement("button");
    folder.innerText = "Open folder";
    bs.appendChild(folder);

    folder.addEventListener("click", ()=>{
        var str = path.join(materialPath, el.fileName);
        ipcRenderer.invoke("open-folder-path", str);
    })

    return wr;
}

module.exports = { contextMenuHandler, removeContextMenu };