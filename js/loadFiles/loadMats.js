const { ipcRenderer } = require("electron");
const { fetch } = require("./config.js");
const path = require("path");
const fs = require("fs-extra");
const AdmZip = require("adm-zip");
const { createMaterial } = require("../../js/browser/materialHandler.js");

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
        try {
            //Get resolutions of this material

            await createMaterial(titles[i]);
        } catch (error) {
            console.error(error);
        }
    }
}

var doNotReturn = [
    "Previews",
    "configs"
]

function getMaterialResolutions(material) {
    return new Promise((resolve, reject)=>{
        fs.readdir(path.join(materialPath, "temp", material))
        .then(res=>{  
            //Remove unwanted folder names from the return list
            for(let i = 0; i < doNotReturn.length; i++) {
                if(res.indexOf(doNotReturn[i]) != -1) {
                    res.splice(res.indexOf(doNotReturn[i]), 1);
                }
            }

            resolve(res);
        })
        .catch(err=>{
            reject(err);
        })
    })
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


                //Rename the resolution folders to 2K_SnowTracks001, for instance
                try {
                    var dirFiles = await fs.readdir(path.join(materialPath, "temp", folder));
                } catch (error) {
                    console.error(error);
                }

                //Filter out the folders that shouldn't be renamed
                var doNotRename = [
                    "configs",
                    "Previews"
                ];

                for(x of doNotRename) {
                    dirFiles.splice(dirFiles.indexOf(x), 1);
                }

                //Rename files
                for(x of dirFiles) {
                    if(x.split("_").length == 1) {
                        try {
                            await fs.rename(path.join(materialPath, "temp", folder, x), path.join(materialPath, "temp", folder, x + "_" + folder));
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }


                function createConfig() {
                    return new Promise(async (resolve, reject)=>{
                        try {
                            var file = await fs.readFile(path.join(materialPath, "temp", folder, "configs", "materialConfig.json"), "utf8");
                            await mergeConfigs(JSON.parse(file));
                            resolve();
                        } catch (error) {
                            console.error(error);
                            //did not work
                            try {
                                await createNew();
                                resolve();
                            } catch (error) {
                                reject();
                            }
                        }



                        async function createNew() {
                            try {
                                console.log(folder, configTemplate);
                                await fs.mkdir(path.join(materialPath, "temp", folder, "configs"));
                                await fs.writeFile(path.join(materialPath, "temp", folder, "configs", "materialConfig.json"), JSON.stringify(configTemplate, null, 4));
                            } catch (error) {
                                //Did not work..
                                console.error(error);
                                return false;
                            }

                            return true;
                        }

                        async function mergeConfigs(file) {
                            alert("merging")
                            //configTemplate is the one thats new
                            var date = new Date();
                            file.editedStamp = date;

                            file.resolutions.push(configTemplate.resolutions);

                            try {
                                await fs.writeFile(path.join(materialPath, "temp", folder, "configs", "materialConfig.json"), JSON.stringify(file, null, 4));
                                return true;
                            } catch (error) {
                                return false;
                            }
                            
                        }
                    })
                }

                //Create config folder for MatParse configuration files
                const configTemplate = {
                    tags: [

                    ],
                    resolutions: [

                    ],
                    timeStamp:undefined,
                    editedStamp:undefined
                }

                //Get material resolutions
                try {
                    var resolutions = await getMaterialResolutions(folder);
                } catch (error) {
                    //could not get resolutions
                    console.error(error);
                }

                resolutions = resolutions || [];
            
                //Remove the other stuff from the resolution folder names
                var newRes = []; 
                if(resolutions.length > 0) {
                    for(let i = 0; i < resolutions.length; i++) {
                        newRes.push(resolutions[i].split("_")[0]);
                    }
                }
        
                if(newRes.length > 0) {
                    resolutions = newRes;
                }



                //Set config values

                configTemplate.resolutions = resolutions;                
                //There are no tags as of now

                //Set date
                var date = new Date();
                configTemplate.timeStamp = date;


                try {
                    await createConfig();
                } catch (error) {
                    console.error(error);
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
                    console.log(x, path.path(addedFiles[i].name));
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

//module.exports = { loadMats, loadFiles };