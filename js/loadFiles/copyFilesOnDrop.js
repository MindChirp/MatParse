const fs = require("fs-extra");
const { fetch } = require("./config");
const path = require("path");

var materialPath;
function copyDraggedFiles(files) {
    return new Promise(async (resolve, reject)=>{

        var failedFiles = [];

        console.log(files);
        if(!Array.isArray(files)) {reject("Invalid input")};
        if(files.length == 0) {reject("There were no files selected")};
        
        materialPath = JSON.parse(await fetch()).filePath;
        console.log(materialPath);
        //iterate through each file, and copy it over to the material folder
        for(let i = 0; i < files.length; i++) {
            try {
                await fs.copyFile(files[i].path, path.join(materialPath, files[i].name))
            } catch (error) {
                failedFiles.push(files[i]);
            }
        }
        
        resolve(failedFiles);
    })
}

module.exports = { copyDraggedFiles }