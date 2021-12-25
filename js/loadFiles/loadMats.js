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
    *3 - ?
    *4 - ?
*/




function loadMats() {
    return new Promise(async (resolve, reject)=>{
        var status = {status:1}; //Set default resolve response

        //Fetch the material folder
        fetch()
        .then(res=>{
            materialPath = JSON.parse(res).filePath;
            loadFiles(JSON.parse(res).filePath);
        })
        .catch(err=>{
            console.error(err);
            reject(error);
        })


        //First, convert any archived folders
        try {
            await searchForZips();
        } catch (error) {
            alert("Could not convert any possible zips");
        }

        async function loadFiles(path) {
            try {
                var dir = await fs.readdir(path);
            } catch (error) {
                console.log(error);
                reject(error);
            }

            createCards(dir);
        }
    })

}


function createCards(titles) {

    var parent = document.querySelector("#program-wrapper > div.explorer-wrapper > div.browser.frontpage > div > div");

    for(let i = 0; i < titles.length; i++) {
        var el = document.createElement("div");
        el.className = "element";
        el.innerText = titles[i];
        parent.appendChild(el);
    }
}

var archiveTypes = [".zip"];

function searchForZips() {
    return new Promise(async(resolve, reject)=>{

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
            try {
                await unzipFiles(names);
            } catch (error) {
                //Some error

                /*
                STATUS CODES
                    *10 - no content in array
                    *11 - input is not an array
                    *12 - general error
                */
            }
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
                        reject(reject(status));
                    }
                }

                //Delete the archives
                for(let i = 0; i < files.length; i++) {
                    try {
                        await fs.unlink(path.join(materialPath, files[i]));
                    } catch (error) {
                        console.error(error);
                        status = 12;
                        reject(status);
                    }
                }

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

module.exports = { loadMats };