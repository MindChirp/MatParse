const { ipcRenderer } = require("electron");
const { fetch } = require("./config.js");
const path = require("path");
const fs = require("fs-extra");
const AdmZip = require("adm-zip");
var materialPath;

/* Status codes: 
    *0 - No files were found
    *1 - OK, files extracted and process finished
    *2 - Some files weren't extracted, but the process completed anyways
    *3 - No files were extracted because of an error
    *4 - Loaded files, but no new archives were found
    *1005 - Could not display materials in viewport
*/




function loadMats() {
    return new Promise(async (resolve, reject)=>{
        var status = {status:[]}; //Set default resolve response

        //Fetch the material folder
        try {
            var res = await fetch();
            materialPath = JSON.parse(res).filePath;
            //await loadFiles(JSON.parse(res).filePath); 
        } catch (error) {
            console.error(error);
            reject({status: status.status, additional: 1005});
        }


        //First, convert any archived folders
        searchForZips()
        .then(async res=>{
            if(res.status == 4 || res.status == 3 || res.status == 0) {
                //If there are no archives to process, do this
                if(res.status != 1) {
                    status.status.push(res.status);
                }
                resolve(status);
            } else {

                try {
                    var res = await arrangeFolders(res.processedFiles);
                } catch (error) {
                    console.error(error);
                    status.status.push(3);
                    reject(status);
                }
                if(status.status.length == 0){
                    status.status.push(1);
                    resolve(status);
                }
            }


            //Done searching for zipped files, extracting them and organizing them,
        })

    })

}



var dontDisplay = [
    "temp",
]


function cleanDirList(dir) {
    //Remove any unwanted files from the browser list
    for(let i = 0; i < dontDisplay.length; i++) {
        var ind = dir.indexOf(dontDisplay[i]);
        if(ind != -1) {
            dir.splice(ind,1);
        }
    }

    //Remove duplicate files, e.g. (1), (2) etc

    for(let i = 0; i < dir.length; i++) {
        if(dir[i].indexOf("(") != -1) {
            dir.splice(i,1);
        }
    }

    //Remove any .zip files
    for(let z = 0; z < dir.length; z++) {
        if(dir[z].includes(".zip")) {
            dir.splice(z,1);
        }
    }

    return dir;
                
}

function loadFiles(path) {
    return new Promise(async (resolve, reject)=>{
            try {
                var dir = await fs.readdir(path);
            } catch (error) {
                console.log(error);
                reject(error);
            }


            //Check if there are any files already loaded
            var par = document.querySelector("#program-wrapper > div.explorer-wrapper div.browser.frontpage div.scroller > div.grid");
            var elements = par.children;
            if(elements.length > 0) {

                //Remove the already loaded files from the directory array
                for(let i = 0; i < elements.length; i++) {
                    var ind = dir.indexOf(elements[i].fileName);
                    if(ind != -1) {
                        dir.splice(ind, 1);
                    }
                }   
            }


            var cleaned = cleanDirList(dir);

            
            createCards(cleaned);
            resolve();
        })
    }

async function createCards(titles) {
    for(let z = 0; z < titles.length; z++) {
        if(titles[z].includes(".zip")) {
            titles.splice(z-1,1);
        }
    }


    var parent = document.querySelector("#program-wrapper > div.explorer-wrapper > div.browser.frontpage > div.scroller > div.grid");

    for(let i = 0; i < titles.length; i++) {
        var el = document.createElement("div");
        el.className = "element";
        el.fileName = titles[i];
        if(titles[i].includes(".zip")) continue;
        
        var img = document.createElement("img");
        img.className = "preview-image";

        var title = document.createElement("span");
        title.className = "title";
        title.innerText = titles[i];

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
        var _img;

        var z = 0;
        await loop();
        async function loop() {
            try {
                _img = await fs.readFile(path.join(materialPath, titles[i], "Previews", titles[i] + paths[conf][z] + ".jpg"));
            } catch (error) {
                if(z < paths[conf].length-1) {
                    z++
                    await loop();
                }
            }
        }


        if(!_img) {continue};

        var src = "data:image/png;base64," + _img.toString("base64");
        
        img.src = src;

        parent.appendChild(el);

    }
}

var archiveTypes = [".zip"];

function searchForZips() {
    return new Promise(async(resolve, reject)=>{

        var processedFiles = [];

        var status = {status: 1} //OK

        //Get the path if it not already defined
        if(!materialPath) {
            try {
                var folderPath = await fetch();
                materialPath = JSON.parse(folderPath).filePath;      
            } catch (error) {
                alert("Could not fetch material path");
                reject();
            }
        }


        //Read the dir
        fs.readdir(materialPath, async (err, dat)=>{
            if(dat.length == 0) {resolve({status:0})}

            //Sort out the files that are not an archive
            var names = parseFileNames(dat);
            processedFiles = names;
            if(names.length == 0) {resolve({status: 4}); return;}
            try {
                await unzipFiles(names);
            } catch (error) {
                //Some error

                /*
                STATUS CODES
                    *10 - no content in array
                    *11 - input is not an array
                    *12 - general error
                    *13 - OK
                */

                /* Status codes: 
                    *0 - No files were found
                    *1 - OK, files extracted and process finished
                    *2 - Some files weren't extracted, but the process completed anyways
                    *3 - No files were extracted because of an error
                    *4 - Loaded files, but no new archives were found
                */
                var errors = new Map([[10,0], [13,1], [12,2], [11,3]]);

                status.status = errors.get(error.status);

                resolve(status);
            }

            resolve({status: 1, processedFiles: processedFiles});
        })


        //Check if file is an archive
        function parseFileNames(dat) {
            var parsedNames = [];
            for(let i = 0; i < dat.length; i++) {
                var ext = path.extname(dat[i]);
                for(let z = 0; z < archiveTypes.length; z++) {
                    //Check extension agains all known archive types
                    if(ext == archiveTypes[z]) {
                        //Archive file found, register it
                        parsedNames.push(dat[i]);
                    }
                }
            }

            return parsedNames;
        }


        /*
            STATUS CODES
                *10 - no content in array
                *11 - input is not an array
                *12 - general error
                *13 - OK
        */
        function unzipFiles(files) {
            return new Promise(async (resolve, reject)=>{
                var status = {status:13};

                if(files.length == 0) {reject({status:10})} 
                if(!Array.isArray(files)) {reject({status:11})}
                
                for(let i = 0; i < files.length; i++) {
                    try {
                        await extractArchive(files[i]);
                    } catch (error) {
                        status = 12;
                    }
                }

                //Delete the archives
                for(let i = 0; i < files.length; i++) {
                    try {
                        await fs.unlink(path.join(materialPath, files[i]));
                    } catch (error) {
                        console.error(error);
                        status = 12;
                    }
                }

                resolve(status);

            })
        }


        function extractArchive(filepath) {
            return new Promise(async (resolve, reject)=>{
                if(Array.isArray(filepath)) {reject()}
                try {
                    const zip = new AdmZip(path.join(materialPath, filepath));

                    //Create output directory name
                    var fileName = path.parse(filepath).name;

                    const outputdir = path.join(materialPath, fileName);
                    zip.extractAllTo(outputdir);
                    console.log("Extracted to ", outputdir);
                    resolve();
                } catch (error) {
                    console.error(error);
                    reject(error);
                }
            })

        }


    })
}

function arrangeFolders(files) {
    return new Promise((resolve, reject)=>{

        //Read the dir
        fs.readdir(path.join(materialPath))
        .then(async res=>{
            fixHierarchy(res, files)
            .then(()=>{
                //Delete every new folder except the temp folder, copy over the files
                cleanUp(files)
                .then(()=>{
                    
                    resolve();
                })
                .catch(err=>{
                    console.error(err);
                    resolve({status: 3});
                })
            })
            .catch(err=>{
                console.error(err);
                resolve({status: 3});
            })
        })
        .catch(err=>{
            console.error(err);
            resolve({status: 3});
        })
    })

}

/*
    STATUS CODES
        *10 - no content in array
        *11 - input is not an array
        *12 - general error
        *13 - OK
        *14 - general critical error
*/
function fixHierarchy(names, addedFiles) {
    return new Promise(async (resolve, reject)=>{
        if(!Array.isArray(names)) {reject({status: 11})};
        if(names.length == 0) {reject({status:10})};
        
        var cloneFiles = (folder)=>{
            return new Promise(async (resolve, reject)=>{

                var unprocessedname = folder;
                //Remove index number from folder name, e.g. snowtexture001 (2)
                if(folder.indexOf("(") != -1) {
                    var processedName = folder.substring(
                        0, 
                        (folder.lastIndexOf("(")-1)
                    );

                    folder = processedName;
                }


                
                //Clone all the nescessary files
                //Clone the resolution folders
                var paths = [
                    [path.join(materialPath, unprocessedname, folder, "REGULAR"), path.join(materialPath, "temp", folder)],
                    [path.join(materialPath, unprocessedname, folder, "Previews"), path.join(materialPath, "temp", folder, "Previews")]
                ];

                for(x of paths) {
                    try {
                        await fs.copy(x[0], x[1])
                    } catch (error) {
                        console.error(error); reject(error);
                    }
                   
                }

                resolve();

                
            })

        }

        try {
            await fs.mkdir(path.join(materialPath, "temp"));
        } catch (error) {
            //Could not make the directory
            reject({status: 14});
        }

        for(x of names) {
            //Create the temporary folder for copying
            try {
                if(x.indexOf("(") == -1) {  
                    await fs.mkdir(path.join(materialPath, "temp", x))
                } 
                var skip = true;
                for(let i = 0; i < addedFiles.length; i++) {
                    if(x == path.parse(addedFiles[i]).name) {
                        skip = false;
                    }
                }

                if(!skip) {
                    await cloneFiles(x);
                }
                
            } catch (error) {
                console.error(error);
            }
        }


        resolve();
        
    })
}

function cleanUp(addedFiles) {
    return new Promise(async (resolve, reject)=>{

        //Let's delete the used folders except from the temp folder
        try {
            var dir = await fs.readdir(materialPath);
        } catch (error) {
            console.error(error);
        }

        for(let i = 0; i < dir.length; i++) {
            if(dir[i] == "temp") continue;
            var skip = true;
            for(let m = 0; m < addedFiles.length; m++) {
                if(path.parse(addedFiles[m]).name == dir[i]) {
                    skip = false;
                }
            }
            if(!skip) {

                try {
                    fs.rmSync(path.join(materialPath, dir[i]), {recursive:true,force:true});
                } catch (error) {
                    console.error(error);
                }
            }
        }

        //Done with deleting, copy over everything
        fs.copy(path.join(materialPath, "temp"), materialPath)
        .then(()=>{
            try {
                fs.rmSync(path.join(materialPath,"temp"),{recursive:true,force:true})
            } catch (error) {
                reject(error);
            }
            resolve()
        })
        .catch(err=>{
            reject(err);
        })
    })

}

module.exports = { loadMats, loadFiles };