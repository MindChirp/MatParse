const fs = require("fs-extra");
const path = require("path");

function validate(appPath) {

    var doesNotContain = [];
    var newLaunch = false;

    return new Promise((resolve, reject)=>{
        fs.readFile(path.join(__dirname, "resources", "controlFiles.json"), "utf8", (err, dat)=>{
            if(err) reject(err);
            controlFiles(JSON.parse(dat).files);
        })


        async function controlFiles(checkArr) {
            try {
                var dir = await fs.readdir(appPath)
                console.log(dir);
            } catch (error) {
                reject(error);
            }

            for(let i = 0; i < checkArr.length; i++) {
                if(!dir.includes(checkArr[i].name)) {
                    doesNotContain.push(checkArr[i].name);
                    if(checkArr[i].role == 0) {
                        //This folder is CRITICAL, launch the program as new
                        newLaunch = true;
                    }
                }
            }


            if(doesNotContain.length == 0) resolve({new: newLaunch}); //If there are no missing folders, stop here.

            //Create all the folders that does not exist
            for(let i = 0; i < doesNotContain.length; i++) {
                try {
                    await fs.mkdir(path.join(appPath, doesNotContain[i]))
                } catch (error) {
                    console.log("Could not create ", doesNotContain[i]);
                }
            }

            resolve({new: newLaunch});
        }
    })
}

module.exports = { validate };