function changePreview(el) {
    //Get the type selected
    var type = el.id;

    var map = new Map([["box", 0], ["sphere", 1], ["flat", 2]]);

    var id = map.get(type);

    localStorage.setItem("preview", JSON.stringify({type:id}));
}

function applyPreviewType(type) {
    /*
        0 - box
        1 - sphere
        2 - flat
    */

    //Get the elements
    var par = document.querySelector("#program-wrapper > div.explorer-wrapper > div.browser.frontpage > div > div");
    var els = par.children;

    for(let i = 0; i < els.length; i++) {
        var el = els[i];
                
    }
}