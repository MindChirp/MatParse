//Fetch the user config
const { ipcRenderer } = require("electron");

const fs = require("fs-extra");
const path = require("path");

async function fetch() {
    return new Promise(async (resolve, reject)=>{

        try {
            var config = await ipcRenderer.invoke("fetch-config", "");
        } catch (error) {
            console.log(error);
            reject(error);
        }

        resolve(JSON.parse(config));
      
    })
}

var materialPath;

function fetchMaterialConfig(material) {
    return new Promise(async (resolve, reject)=>{
        if(!materialPath) {
            materialPath = JSON.parse(await fetch()).filePath;
        } 
        //Read the file
        fs.readFile(path.join(materialPath, material, "configs", "materialConfig.json"))
        .then(res=>{
            resolve(JSON.parse(res));
        })
        .catch(err=>{
            reject(err);
        })
    })
}

module.exports = { fetch, fetchMaterialConfig };