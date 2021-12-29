const fs = require("fs-extra");
const { fetchMaterialConfig, fetch } = require("../loadFiles/config");
const path = require("path");

/*
    STATUS CODES
        *0 - Success
        *1 - No resolutions selected
        *2 - Some folders failed to copy
        *3 - TOTAL FAILURE
        *4 - Some resolutions may not have been included
*/

var dragMaterialList = [];
var selectedResolutions = [];
var folderList = [];

var status = [];

var materialPath;

function dragMaterialOut(el) {
    return new Promise(async (resolve, reject)=>{

        if(!materialPath) {
            try {
                materialPath = JSON.parse(await fetch()).filePath;
            } catch (error) {
                status.push(3)
                reject(status);
                return;
            }
        }

        folderList = [];
        status = [];
        dragMaterialList = [];
        selectedResolutions = [];

        //Fetch selected resolutions, put into selectedResolutions array START
        selectedResolutions = fetchSelectedResolutions();
        if(selectedResolutions.length == 0) {
            status.push(1);
            reject(status);
        }

        //Get selected elements
        var par = document.querySelector(".browser.frontpage .grid");

        //Add selected elements and dragged element to dragMaterialList array. Merge dragged element with existing elements in array.
        var selected = par.getElementsByClassName("element selected");
        for(let i = 0; i < selected.length; i++) {
            dragMaterialList.push(selected[i]);
        }


        if(!containsObject(el, dragMaterialList)) {
            dragMaterialList.push(el);
        }

        //Iterate through each entry in the dragMaterialList array
        for(x of dragMaterialList) {
            try {
                await processIndividualMaterial(x);
                
            } catch (error) {
                console.error(error);
                status.push(2)
            }
        }



        resolve(folderList);
    })

}

function fetchClosestResolutions(resolutions) {
    //Fetch the closest matching selected resolutions STOP
    //selectedResolutions

    var matching = [];

    //Add directly matching resolutions
    for(let i = 0; i < selectedResolutions.length; i++) {
        for(let n = 0; n < resolutions.length; n++) {
            if(selectedResolutions[i] == resolutions[n]) {
                matching.push(resolutions[n]);
            }
        }
    }


    if(matching.length > 0)  {return matching;}

    //If there still haven't been found any matching resolutions, add the closest one
    var filteredSelectedRes = [];
    parseNum = str => +str.replace(/[^.\d]/g, '');
    for(let i = 0; i < selectedResolutions.length; i++) {
        filteredSelectedRes.push(parseNum(selectedResolutions[i]));
    }

    var filteredRes = [];

    for(let i = 0; i < resolutions.length; i++) {
        if(resolutions[i] != "HIRES") {
            filteredRes.push(parseNum(resolutions[i]));
        } else {
            filteredRes.push(resolutions[i]);
        }
    }

    
    
    var closest = findClosest(filteredSelectedRes[filteredSelectedRes.length-1], filteredRes);

    if(!closest && filteredRes.includes("HIRES")) {
        return "HIRES"
    } else if(!closest) {
        return undefined;
    } else {
        return [closest + "K"];
    }

}


function findClosest(x, arr) {
    var indexArr = arr.map(function(k) { return Math.abs(k - x) })
    var min = Math.min.apply(Math, indexArr)
    return arr[indexArr.indexOf(min)]
}



function processIndividualMaterial(element) {
    return new Promise(async (resolve, reject)=>{

        var material = element.fileName;

        try {
            var conf = await fetchMaterialConfig(material);
        } catch (error) {
            console.error(conf);
            reject(error);
        }  

        //Fetch the closest matching selected resolutions START
        var matchingReses = await fetchClosestResolutions(conf.resolutions);
        //Are there more than 1 matching resolutions?
        if(matchingReses.length > 1) {
            //Yes
            try {
                //Delete any contents of the material subfolder with same name as main folder START
                await cleanUpCopyFolder(material);
            } catch (error) {
                reject(error)
            }

            //Copy over matching resolutions to the subfolder
            try {
                await copyMatchingResolutions(material, matchingReses);
            } catch (error) {
                reject(error);
            }

            //Add subfolder (full path) to folderList array
            folderList.push(path.join(materialPath, material, material));
        } else {
            //No
            
            //Add single resolution folder (full path to folderList array)
            folderList.push(path.join(materialPath, material, matchingReses[0]));
        }
        
        resolve();
    })
}

function copyMatchingResolutions(material, resolutions) {
    return new Promise(async (resolve, reject)=>{
        var filePath = path.join(materialPath, material);

        for(let i = 0; i < resolutions.length; i++) {
            try {
                await fs.copy(path.join(filePath, resolutions[i]), path.join(filePath, material, resolutions[i]))
            } catch (error) {
                //a resolution did not get added..
                status.push(4);
            }
        }

        resolve();
    })
}


function cleanUpCopyFolder(material) {
    return new Promise(async (resolve, reject)=>{
        //Delete any contents of the material subfolder with same name as main folder STOP
        var folderPath = path.join(materialPath, material, material);
        console.log(folderPath)

        try {
            await fs.mkdir(folderPath, {recursive: true});
        } catch (error) {
            console.error(error);
            reject(error);
            return;
        }

        try {
            var folders = await fs.readdir(folderPath);
        } catch (error) {
            reject(error);
            return;
        }

        for(let i = 0; i < folders.length; i++) {
            try {
                await fs.rm(path.join(folderPath, folders[i]));
            } catch (error) {
                //Did not go so well.. ok screw that
            }
        }

        resolve();
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

function fetchSelectedResolutions() {
    //Fetch selected resolutions, put into selectedResolutions array STOP

    var selectedResolutions = [];
    
    var par = document.querySelector("#program-wrapper > div.explorer-wrapper > div.side-bar.frontpage > div.options-wrapper > div.options-selector > div.options > div.resolution");
    //Get inputs
    var inps = par.getElementsByTagName("input");

    for(x of inps) {
        if(x.checked == true) {
            selectedResolutions.push(x.id);
        }
    }

    return selectedResolutions;
}

module.exports = { dragMaterialOut };