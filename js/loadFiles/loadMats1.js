const AdmZip = require("adm-zip");
const fs = require("fs-extra");
const path = require("path");
const { fetch } = require("../loadFiles/config.js");
const { createMaterial } = require("../../js/browser/materialHandler.js");

var materialPath;
var notZips = [];
var zipList = [];

var materialHasSibling;

var cleanExecution = false;

var ignoreFolders = [];

var excludeInRenamingProcess = [
    "Previews",
    "configs"
]

var deleteAfterProcess = [
    "temp",
    "unzips"
]

/*Status codes

    *0 - Completed, with all operations successful
    *1 - No operation done, error in early stages
    *2 - Error occured, leading to one or more materials not loaded
    *3 - 
    *4 - 

*/

function loadMats() {
    return new Promise(async (resolve, reject)=>{

        ignoreFolders = [];
        var errors = [];

        //Get folder names
        if(!materialPath) {
            materialPath = JSON.parse(await fetch()).filePath;
        }
        
        //Get folder names
        try {
            var folders = await fs.readdir(materialPath);
        } catch (error) {
            errors.push(1);
            reject(errors)
        }

        //Create /unzips folder
        try {
            await fs.mkdir(path.join(materialPath, "unzips"));
        } catch (error) {
            errors.push(1);
            reject(errors);
        }

        //Create temp folder


        try {
            await fs.mkdir(path.join(materialPath, "temp"));
        } catch (error) {
            console.log(error);
            errors.push(1);
            reject(errors);
            return;
        }

        notZips = getNonZipFolders(folders);
        //Get all .zip-files, add to array START
        var zips = getZipFolders(folders);
        console.log(zips);
        //Iterate through each zip entry in array
        for(let i = 0; i < zips.length; i++) {
            try {
                await processArchiveFolder(zips[i]);
            } catch (error) {
                //Error
                errors.push[2];
            }
        }

        //Remove all the leftover junk
        for(let i = 0; i < zipList.length; i++) {
            try {
                fs.rmSync(path.join(materialPath, zipList[i] + ".zip"), {recursive:true,force:true});
            } catch (error) {
                console.error(error);
                cleanExecution = false;
            }
        }
        for(let i = 0; i < deleteAfterProcess.length; i++) {
            try {
                fs.rmSync(path.join(materialPath, deleteAfterProcess[i]), {recursive:true,force:true});
            } catch (error) {
                console.error(error);
                cleanExecution = false;
            }
        }



        resolve(cleanExecution);

    })
}

function updateNotZipList() {
    return new Promise(async (resolve, reject)=>{
        //Get folder names
        try {
            var folders = await fs.readdir(materialPath);
        } catch (error) {
            reject()
        }
        notZips = getNonZipFolders(folders);  

        resolve();
    })
}


function getZipFolders(folders) {
    //Get all .zip-files, add to array STOP
    var zips = [];

    for(let i = 0; i < folders.length; i++) {
        var ext = path.parse(folders[i]).ext;
        if(ext == ".zip") {
            zips.push(path.parse(folders[i]).name); //Return only filename without extension
        }
    }

    zipList = zips;

    return zips;
}

function getNonZipFolders(folders) {
    var nonZips = [];

    for(let i = 0; i < folders.length; i++) {
        var ext = path.parse(folders[i]).ext;
        if(ext.length == 0) {
            nonZips.push(folders[i]);
        }
    }

    return nonZips;
}


function removeNameIndexing(folder) {
    //Remove any indexing in file name, e.g. (1), (2), _1, _2 STOP
    var str = {original: folder, withoutIndex: undefined};
    if(folder.indexOf("(") != -1) {
        //Remove this part
        str.withoutIndex = folder.split("(")[0].replace(/ /g, '');
    }
    
    if(folder.indexOf("_") != -1) {
        //Remove this part
        str.withoutIndex = folder.split("_")[0];
    }

    return str;

}


function processArchiveFolder(folder) {
    return new Promise(async (resolve, reject)=>{
        //Remove any indexing in file name, e.g. (1), (2), _1, _2 START
        folder = removeNameIndexing(folder);
        //Update notZips
        try {
            await updateNotZipList();
        } catch (error) {
            reject();
            return;
        }

        //Unzip folder into ./unzips START
        try {
            await unzipFolder(folder);
        } catch (error) {  
            reject();
        }
        console.log("NOT ZIPS ", notZips)
        //Determine if uzipped folder has a sibling in the root folder
        materialHasSibling = false;
        for(let i = 0; i < notZips.length; i++) {
            if(folder.withoutIndex == notZips[i] || folder.original == notZips[i]) {
                //This folder has a sibling in the root folder!
                materialHasSibling = true;
            }
        }

        if(materialHasSibling) {
            //Has sibling

            //Copy over folder with same name in root folder to ../temp folder
            try {
                await copyMatchingRootFolder(folder);
            } catch (error) {
                reject();
            }

            //Copy only resolution folders to the temp folder clone
            var withoutExt = folder.withoutIndex || folder.original;
            var source = path.join(materialPath, "unzips", folder.original, withoutExt, "REGULAR");
            var destination = path.join(materialPath, "temp", withoutExt);
            try {
                await fs.copy(source, destination);
            } catch (error) {
                reject();
            }

        } else {
            //Does not have sibling
            var withoutExt = folder.withoutIndex || folder.original;

            try {
                await fs.mkdir(path.join(materialPath, "temp", withoutExt))
            } catch (error) {
                reject();
            }

            try {
                await copyResAndPreviewFolders(folder);
            } catch (error) {
                reject();
            }
        }

        //Rename resolution folders, making them contain the material name, e.g. 2K_SnowTracks001 START
        try {
            await renameResolutionFolders(folder);
        } catch (error) {
            reject();
        }


        var withoutExt = folder.withoutIndex || folder.original;

        if(materialHasSibling) {
            //Fetch configs/materialConfig.json file in the temp location folder

            try {
                var config = JSON.parse(await fs.readFile(path.join(materialPath, "temp", withoutExt, "configs", "materialConfig.json"), "utf8"));
            } catch (error) {
                console.error(error);
                reject();
            }

            
            //Fetch material resolutions in an array, e.g. ["2K"] STOP
            try {
                var resolutions = await fetchMaterialResolutions(folder);
            } catch (error) {
                console.error(error);
                reject();
                return;
            }

            for(let i = 0; i < resolutions.length; i++) {
                if(!config.resolutions.includes(resolutions[i])) {
                    config.resolutions.push(resolutions[i]);
                }
            }

            config.editStamp = new Date();
            
            try {
                await fs.writeFile(path.join(materialPath, "temp", withoutExt, "configs", "materialConfig.json"), JSON.stringify(config, null, 4));
            } catch (error) {
                console.error(error);
                reject();
            }

        } else {
            //Create configs folder in temp folder
            

            try {
                await fs.mkdir(path.join(materialPath, "temp", withoutExt, "configs"));
            } catch (error) {
                reject();
            }
            
            //Fetch material resolutions in an array, e.g. ["2K"]
            try {
                var resolutions = await fetchMaterialResolutions(folder);
            } catch (error) {
                reject();
            }

            var confTemplate = {
                resolutions: [],
                createdStamp: undefined,
                editedStamp: 0
            }

            confTemplate.resolutions = resolutions;
            confTemplate.createdStamp = new Date();

            //save .json file to configs/materialConfig.json with timeStamp, tags and resolution keys
            try {
                await fs.writeFile(path.join(materialPath, "temp", withoutExt, "configs", "materialConfig.json"), JSON.stringify(confTemplate, null, 4));
            } catch (error) {
                reject();
            }
        }


        //Copy folder out to root
        try {
            await fs.copy(path.join(materialPath, "temp", withoutExt), path.join(materialPath, withoutExt));
        } catch (error) {
            console.error(error);
            reject();
        }

        //We're done processing this material!
        resolve();
    })
}



function fetchMaterialResolutions(folder) {
    return new Promise(async (resolve, reject)=>{
        //Fetch material resolutions in an array, e.g. ["2K"] STOP

        var withoutExt = folder.withoutIndex || folder.original;

        try {
            var folders = await fs.readdir(path.join(materialPath, "unzips", folder.original, withoutExt, "REGULAR"));
        } catch (error) {
            reject();
        }

        //Get the resolutions
        resolve(folders);
    })
}

function copyMatchingRootFolder(folder) {
    return new Promise(async (resolve, reject)=>{

        var folderName = folder.withoutIndex || folder.original;

        try {
            //Copy root folder to temp
            await fs.copy(path.join(materialPath, folderName), path.join(materialPath, "temp", folderName));
        } catch (error) {
            console.error(error);
            reject();
        }


        resolve();
    })
}


function copyResAndPreviewFolders(folder) {
    return new Promise(async (resolve, reject)=>{
        var withoutExt = folder.withoutIndex || folder.original;

        var source = path.join(materialPath, "unzips", folder.original, withoutExt, "REGULAR");
        var destination = path.join(materialPath, "temp", withoutExt);
        try {
            await fs.copy(source, destination);
        } catch (error) {
            reject();
        }

        var source = path.join(materialPath, "unzips", folder.original, withoutExt, "Previews");
        var destination = path.join(materialPath, "temp", withoutExt, "Previews");
        try {
            await fs.copy(source, destination);
        } catch (error) {
            console.error(error);
            reject();
        }

        resolve();
    })
}


function unzipFolder(folder) {
    return new Promise(async (resolve, reject)=>{
        //Unzip folder into ./unzips STOP

        var output = path.join(materialPath, "unzips", folder.original);
        
        try {
            const zip = new AdmZip(path.join(materialPath, folder.original + ".zip"))
            zip.extractAllTo(output);
        } catch (error) {
            console.error(error);
            reject();
        }

        console.log("Extracted to ", output);
        resolve();
    })
}

function renameResolutionFolders(folder) {
    return new Promise(async (resolve, reject)=>{
        //Rename resolution folders, making them contain the material name, e.g. 2K_SnowTracks001 STOP

        var withoutExt = folder.withoutIndex || folder.original;
        try {
            var folders = await fs.readdir(path.join(materialPath, "temp", withoutExt));
        } catch (error) {
            console.error(error);
            reject();
        }

        //Remove any unwanted folders from the list
        for(let i = 0; i < excludeInRenamingProcess.length; i++) {
            var index = folders.indexOf(excludeInRenamingProcess[i]);
            if(index != -1) {
                folders.splice(index,1);
            }
        }

        //Rename the folders
        for(let i = 0; i < folders.length; i++) {
            if(folders[i].split("_").length == 1) {
                var src = path.join(materialPath, "temp", withoutExt, folders[i]);
                var dest = path.join(materialPath, "temp", withoutExt, folders[i] + "_" + withoutExt);
                try {
                    await fs.rename(src, dest);
                } catch (error) {
                    reject();
                }
            }
        }

        resolve();

    })
}

function cleanDirList(dir) {
    //Remove any unwanted files from the browser list
    for(let i = 0; i < deleteAfterProcess.length; i++) {
        var ind = dir.indexOf(deleteAfterProcess[i]);
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

module.exports = { loadMats, loadFiles };