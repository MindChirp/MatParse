const { fetchMaterialConfig } = require("../js/loadFiles/config");


async function contextMenuHandler(e) {

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

    var wr = document.createElement("div");
    wr.className = "wrapper";

    var asp = document.createElement("div");
    asp.className = "emphasis";

    var t = document.createElement("span");
    t.innerText = ratio;
    asp.appendChild(t);

    wr.appendChild(asp);

    var bs = document.createElement("div");
    bs.className = "nominal";

    wr.appendChild(bs);


    var del = document.createElement("button");
    del.innerText = "Delete";
    bs.appendChild(del);

    var folder = document.createElement("button");
    folder.innerText = "Open folder";
    bs.appendChild(folder);

    folder.addEventListener("click", ()=>{
        open
    })

    return wr;
}

module.exports = { contextMenuHandler, removeContextMenu };