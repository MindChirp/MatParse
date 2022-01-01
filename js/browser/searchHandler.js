const fzsr = require("fuzzy-search");
const { fetchMaterialConfig } = require("../loadFiles/config");
const { newNotification } = require("../notificationHandler");
const { createMaterial } = require("./materialHandler");

async function searchMaterials(term, tags) {

    var searchOptions = {term: true, tags: true}

    console.log(tags)
    if(!Array.isArray(tags) || tags.length == 0) {searchOptions.tags = false};
    if(typeof term != "string" || term.toString().trim().length == 0) {searchOptions.term = false};
    //Get the loaded material
    var mats = JSON.parse(localStorage.getItem("loaded-materials"));
    
    var grid = document.querySelector(".browser .grid");


    if(searchOptions.term == false && searchOptions.tags == false) {
        //Show the whole list
        grid.innerHTML = "";
        console.log(mats);
        loadMaterials(mats);

        return;
    }
    

    if(searchOptions.term == true && searchOptions.tags == false) {
        alert("asdasd")
        var res = searchArr(mats, term);
        loadMaterials(res);
    }


    function searchArr(arr, term) {
        const searcher = new fzsr(arr, {
            caseSensitive: false
        })

        
        var res = searcher.search(term);
        console.log(arr, term, res);
        return res;
    }


    if(searchOptions.tags) {
        //Get the elements with the selected tags
        var elementsWithTags = [];
        for(let i = 0; i < mats.length; i++) {
            try {
                var conf = await fetchMaterialConfig(mats[i])
                
            } catch (error) {
                continue;
            } 


            conf.tags = conf.tags || [];

            var matching = [];

            for(let m = 0; m < conf.tags.length; m++) {
                if(!tags.includes(conf.tags[m].toLowerCase())) {continue};
                if(matching.includes(conf.tags[m].toLowerCase())) {continue};
                matching.push(conf.tags[m].toLowerCase());
            }

            //Check if the two arrays have the same lengths ==> they have the same contents

            if(matching.length != tags.length) continue;
            elementsWithTags.push(mats[i]);
        }

        grid.innerHTML = "";

        if(!searchOptions.term) {
            //Search only for the tags
            loadMaterials(elementsWithTags);
        } else {
            var res = searchArr(elementsWithTags, term);
            loadMaterials(res);
        }

    }



    function loadMaterials(materials) {
        if(materials.length == 0) {
            if(!grid.parentNode.querySelector(".browser-information")) {

                var h1 = document.createElement("span");
                h1.innerText = "Nothing found";
                h1.className = "browser-information"
                grid.parentNode.appendChild(h1);
                return;
            }
        } else {
            if(grid.parentNode.querySelector(".browser-information")) {
                grid.parentNode.removeChild(grid.parentNode.querySelector(".browser-information"));
            }
        }   

        grid.innerHTML = "";
        materials.forEach(element => {
            createMaterial(element);
        });
    }

}




module.exports = { searchMaterials }