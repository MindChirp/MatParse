const { fetch } = require("../loadFiles/config.js");
const fs = require("fs-extra");
const path = require("path");

var materialPath;

async function changePreview(el) {
    //Get the type selected
    if(!materialPath) {
        materialPath = JSON.parse(await fetch()).filePath;
    } 

    var type = el.id;

    var map = new Map([["box", 0], ["sphere", 1], ["flat", 2]]);

    var id = map.get(type);

    localStorage.setItem("preview", JSON.stringify({type:id}));

    applyPreviewType(id);
}

async function applyPreviewType(type) {
    /*
        0 - box
        1 - sphere
        2 - flat
    */

    //Get the elements
    var par = document.querySelector("#program-wrapper > div.explorer-wrapper > div.browser.frontpage > div.scroller > div.grid");
    var els = par.children;
    console.log(els);
    for(let i = 0; i < els.length; i++) {
        var el = els[i];
        console.log(el);
        var file = el.fileName;

        var prImg = el.querySelector(".preview-image");

        var sleep = (ms)=>{
            return new Promise(resolve=>{
                setTimeout(()=>{
                    resolve();
                }, ms)
            })
        }


        //Get the image
        var paths = [
            ["_preview2", "_Cube"],
            ["_preview1", "_Sphere"],
            ["_flat", "_Flat"]
        ];
        var _img;


        var z = 0;
        await loop();
        async function loop() {
            console.log(materialPath, file, paths[type][z])
            try {
                _img = await fs.readFile(path.join(materialPath, file, "Previews", file + paths[type][z] + ".jpg"));
            } catch (error) {
                console.error(error)
                if(z < paths[type].length-1) {
                    z++
                    await loop();
                }
            }
        }
        

        if(!_img) {continue};

        var src = "data:image/png;base64," + _img.toString("base64");
        prImg.src = src;

    }
}

module.exports = { changePreview }