const config = require("../package.json");

function showProgramInformation() {
    if(document.querySelector(".program-information-pane.smooth-shadow")) {
        var el = document.querySelector(".program-information-pane.smooth-shadow");
        el.parentNode.removeChild(el);
        return;
    }

    var el = document.createElement("div");
    el.className = "program-information-pane smooth-shadow";
    document.body.appendChild(el);

    var title = document.createElement("span");
    title.className = "title";
    el.appendChild(title);
    title.innerText = "Program information"

    var cross = document.createElement("button");
    cross.className = "close";

    cross.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Close</title><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M368 368L144 144M368 144L144 368"/></svg>';
    el.appendChild(cross);

    cross.addEventListener("click", ()=>{
        el.parentNode.removeChild(el);
    })

    var createTile = (title, text)=>{
        var el = document.createElement("div");
        el.className = "tile";
        
        var title1 = document.createElement("p");
        title1.innerText = title;
        title1.className = "title";

        var b = document.createElement("span");
        b.innerText = text;
        b.className = "body";

        el.appendChild(title1);
        el.appendChild(b);

        return el;
    }

    var ver = config.version;

    el.appendChild(createTile("Version", ver));
    el.appendChild(createTile("Made by", "Frikk O. Larsen"));
    el.appendChild(createTile("Contact information", "frikk44@gmail.com"));
}

module.exports = { showProgramInformation };