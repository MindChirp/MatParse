const fzsr = require("fuzzy-search");
const { newNotification } = require("../notificationHandler");
const { createMaterial } = require("./materialHandler");

function searchMaterials(term) {
    //Get the loaded material
    var mats = JSON.parse(localStorage.getItem("loaded-materials"));
    
    var grid = document.querySelector(".browser .grid");



    console.log(mats);
    const searcher = new fzsr(mats, {
        caseSensitive: false
    })

    var res = searcher.search(term);

    console.log(res);

    if(res.length > 0) {    
        //Clear the grid
        grid.innerHTML = "";
        for(let i = 0; i < res.length; i++) {
            createMaterial(res[i]);
        }
    } else {
        newNotification("No materials found");
    }
}


module.exports = { searchMaterials }