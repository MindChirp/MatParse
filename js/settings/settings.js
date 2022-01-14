const { ipcRenderer } = require("electron");
const { ensureLink } = require("fs-extra");

async function open() {
    //Get settings pane if there is one
    var el = document.querySelector("#settings-pane");
    if(el) {
        el.parentNode.removeChild(el);
        var l = document.head.querySelector("settings");
        if(l) {l.parentNode.removeChild(l)};
        return;
    }


    var el = document.createElement("div");
    el.id="settings-pane";

    document.body.appendChild(el);

    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "../css/settings.css";
    link.id = "settings";
    document.head.appendChild(link);


    //Get the config
    var conf = JSON.parse(await ipcRenderer.invoke("fetch-config", ""));
    conf = JSON.parse(conf);

    var sideBar = document.createElement("div");
    sideBar.className = "side-bar";
    el.appendChild(sideBar);

    var wr = document.createElement("div");
    wr.className = "wrapper";
    sideBar.appendChild(wr);

    var back = document.createElement("button");
    back.className = "back";
    back.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Go back</title><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M244 400L100 256l144-144M120 256h292"/></svg>';
    sideBar.appendChild(back);
    back.onclick = ()=>{
        el.parentNode.removeChild(el);
    }

    var sCuts = document.createElement("input");
    sCuts.type = "radio";
    sCuts.id = "shortcuts";
    sCuts.name = "menu-page";
    sCuts.checked = true;
    wr.appendChild(sCuts);
    var lab = document.createElement("label");
    lab.setAttribute("for", "shortcuts");

    wr.appendChild(lab);
    lab.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Shortcuts</title><path d="M208 352h-64a96 96 0 010-192h64M304 160h64a96 96 0 010 192h-64M163.29 256h187.42" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="36"/></svg>';



    var placeholder = document.createElement("input");
    placeholder.type = "radio";
    placeholder.id = "placeholder";
    placeholder.name = "menu-page";
    wr.appendChild(placeholder);
    var lab = document.createElement("label");
    lab.setAttribute("for", "placeholder");

    lab.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Placeholder</title><path d="M448 341.37V170.61A32 32 0 00432.11 143l-152-88.46a47.94 47.94 0 00-48.24 0L79.89 143A32 32 0 0064 170.61v170.76A32 32 0 0079.89 369l152 88.46a48 48 0 0048.24 0l152-88.46A32 32 0 00448 341.37z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M69 153.99l187 110 187-110M256 463.99v-200"/></svg>';
    wr.appendChild(lab)




    var placeholder = document.createElement("input");
    placeholder.type = "radio";
    placeholder.id = "placeholder1";
    placeholder.name = "menu-page";
    wr.appendChild(placeholder);
    var lab = document.createElement("label");
    lab.setAttribute("for", "placeholder1");

    lab.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Placeholder</title><path d="M448 341.37V170.61A32 32 0 00432.11 143l-152-88.46a47.94 47.94 0 00-48.24 0L79.89 143A32 32 0 0064 170.61v170.76A32 32 0 0079.89 369l152 88.46a48 48 0 0048.24 0l152-88.46A32 32 0 00448 341.37z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M69 153.99l187 110 187-110M256 463.99v-200"/></svg>';
    wr.appendChild(lab)



    var placeholder = document.createElement("input");
    placeholder.type = "radio";
    placeholder.id = "placeholder2";
    placeholder.name = "menu-page";
    wr.appendChild(placeholder);
    var lab = document.createElement("label");
    lab.setAttribute("for", "placeholder2");

    lab.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Placeholder</title><path d="M448 341.37V170.61A32 32 0 00432.11 143l-152-88.46a47.94 47.94 0 00-48.24 0L79.89 143A32 32 0 0064 170.61v170.76A32 32 0 0079.89 369l152 88.46a48 48 0 0048.24 0l152-88.46A32 32 0 00448 341.37z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M69 153.99l187 110 187-110M256 463.99v-200"/></svg>';
    wr.appendChild(lab)
}


module.exports = { open }