//Fetch the user config
const { ipcRenderer } = require("electron");

const fs = require("fs-extra");
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

module.exports = { fetch };