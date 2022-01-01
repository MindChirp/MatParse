const fs = require("fs-extra");
const path = require("path");
const { fetch } = require("./loadFiles/config");

function addTag(material, tag) {
    return new Promise(async (resolve, reject)=>{
        //Filter
        if(typeof material != "string" || material.length == 0 || typeof tag != "string" || tag.length == 0) {reject(new Error("Not a valid material type")); return;}
        
        //load the config
        var materialPath = JSON.parse(await fetch()).filePath;
        var configPath = path.join(materialPath, material, "configs", "materialConfig.json");


        var config;

        if(!(await fs.pathExists(configPath))) {
            tagConfig = {tags:[]};
        } else {
            try {
                config = JSON.parse(await fs.readFile(configPath));
            } catch (error) {
                reject(error);
            }
        }

        config.tags = config.tags || [];

        config.tags.push(tag.toLowerCase());

        try {
            await fs.writeFile(configPath, JSON.stringify(config, null, 4))
        } catch (error) {
            reject(error); 
        }

        resolve(config.tags);

    })
}

function loadTags(material) {
    return new Promise(async (resolve, reject)=>{
        //Filter
        if(typeof material != "string" || material.length == 0) {reject(new Error("Not a valid material type")); return;}

        //load the config

        var materialPath = JSON.parse(await fetch()).filePath;

        var configPath = path.join(materialPath, material, "configs", "materialConfig.json");

        try {
            var config = JSON.parse(await fs.readFile(configPath, "utf8"));
        } catch (error) {
            console.error(error);
            reject(error)
            return;
        }

        var tags = config.tags || [];

        resolve(tags);
    })
}

function deleteTag(material, tag) {
    return new Promise(async (resolve, reject)=>{
        //Filter
        if(typeof material != "string" || material.length == 0 || typeof tag != "string" || tag.length == 0) {reject(new Error("Not a valid material type")); return;}
        
        //load the config
        var materialPath = JSON.parse(await fetch()).filePath;
        var configPath = path.join(materialPath, material, "configs", "materialConfig.json");


        var config;

        if(!(await fs.pathExists(configPath))) {
            tagConfig = {tags:[]};
        } else {
            try {
                config = JSON.parse(await fs.readFile(configPath));
            } catch (error) {
                reject(error);
            }
        }
        config.tags = config.tags || [];

        var lowercase = [];
        config.tags.forEach(element => {
            lowercase.push(element.toLowerCase())
        });

        config.tags = lowercase;

        var ind = config.tags.indexOf(tag.toLowerCase());
        if(ind != -1) {
            config.tags.splice(ind, 1);
        }

        try {
            await fs.writeFile(configPath, JSON.stringify(config, null, 4))
        } catch (error) {
            reject(error); 
        }

        resolve(config.tags);

    })
}

function insertIntoTagConfig(tag) {
    return new Promise(async (resolve, reject)=>{

        if(typeof tag != "string" || tag.length < 0) {reject(new Error("Not a valid tag")); return;}

        var appPath = localStorage.getItem("app-path");
        var configPath = path.join(appPath, "userdata", "tags.json");

        var tagConfig;

        if(!(await fs.pathExists(configPath))) {
            tagConfig = {tags:[]};
        } else {
            try {
                tagConfig = JSON.parse(await fs.readFile(configPath), "utf8");
            } catch (error) {
                reject(error);
            }
        }


        tagConfig.tags.push(tag);

        try {
            await fs.writeFile(configPath, JSON.stringify(tagConfig, null, 4));
        } catch (error) {
            reject(error);
        }


        resolve();
    })
}


function loadAllTags() {
    return new Promise(async (resolve, reject)=>{
        //Load all the tags from the tag config
        var appPath = localStorage.getItem("app-path");
        var configPath = path.join(appPath, "userdata", "tags.json");
        if(!(await fs.pathExists(configPath))) {
            resolve([]); //No tags
            return;
        }

        try {
            var tags = JSON.parse(await fs.readFile(configPath, "utf8"));
        } catch (error) {
            reject(error);
        }

        resolve(tags.tags);


    })
}


function appendTags(tags) {
    var par = document.querySelector(".side-bar .options > .tags > .current-tags");
    par.innerHTML = "";

    for(let i = 0; i < tags.length; i++) {
        var tag = document.createElement("div");
        tag.className = "tag";
        tag.innerHTML = /*'<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M435.25 48h-122.9a14.46 14.46 0 00-10.2 4.2L56.45 297.9a28.85 28.85 0 000 40.7l117 117a28.85 28.85 0 0040.7 0L459.75 210a14.46 14.46 0 004.2-10.2v-123a28.66 28.66 0 00-28.7-28.8z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path stroke="currentColor" fill="currentColor" d="M384 160a32 32 0 1132-32 32 32 0 01-32 32z"/></svg>*/'<span>' +tags[i]+ '</span>';

        tag.setAttribute("title", "Click to delete");

        tag.addEventListener("click", async (e)=>{
            var sel = document.querySelector(".browser .grid").getElementsByClassName("material selected");
            //Get selected elements
            var allTags = await deleteTag(sel[0].fileName, e.currentTarget.getElementsByTagName("span")[0].innerText);
            appendTags(allTags);
        })

        par.appendChild(tag);
    }
}

function createTag(tagName) {
    return new Promise(async (resolve, reject)=>{
        if(typeof tagName != "string" || tagName.length == 0) {reject(new Error("Invalid tag type")); return;}

        //Get all tags from file
        var appPath = localStorage.getItem("app-path");
        var configPath = path.join(appPath, "userdata", "tags.json");

        var allTags;

        if(!(await fs.pathExists(configPath))) {
            allTags = {tags:[]} //No tags
        } else {
            allTags = JSON.parse(await fs.readFile(configPath, "utf8"))
        }

        allTags == allTags || {tags:[]}

        allTags.tags.push(tagName.toLowerCase());

        try {
            await fs.writeFile(configPath, JSON.stringify(allTags, null, 4));
        } catch (error) {
            reject(error);
        }

        resolve();
    })
}

module.exports = { addTag, loadTags, deleteTag, loadAllTags, appendTags, createTag }