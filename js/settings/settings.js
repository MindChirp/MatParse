const { fs, ensureLink } = require("fs-extra");
const { fetch } = require("../loadFiles/config");
const { handleShortCut } = require("../keybindHandler");
const { ipcRenderer } = require("electron");

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
    var conf = await fetch();
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


    var sCuts = createButton("Shortcuts", '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Shortcuts</title><path d="M208 352h-64a96 96 0 010-192h64M304 160h64a96 96 0 010 192h-64M163.29 256h187.42" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="36"/></svg>');
    
    //Select shortcuts
    setTimeout(()=>{
        sCuts.input.checked = true;
        var ev = new Event("change");
        sCuts.input.dispatchEvent(ev);
    }, 50)

    var p = createButton("Importing", '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Log In</title><path d="M192 176v-40a40 40 0 0140-40h160a40 40 0 0140 40v240a40 40 0 01-40 40H240c-22.09 0-48-17.91-48-40v-40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M288 336l80-80-80-80M80 256h272"/></svg>');

    //var p0 = createButton("Placeholder0", '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Placeholder0</title><path d="M448 341.37V170.61A32 32 0 00432.11 143l-152-88.46a47.94 47.94 0 00-48.24 0L79.89 143A32 32 0 0064 170.61v170.76A32 32 0 0079.89 369l152 88.46a48 48 0 0048.24 0l152-88.46A32 32 0 00448 341.37z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M69 153.99l187 110 187-110M256 463.99v-200"/></svg>');

    //var p1 = createButton("Placeholder1", '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Placeholder1</title><path d="M448 341.37V170.61A32 32 0 00432.11 143l-152-88.46a47.94 47.94 0 00-48.24 0L79.89 143A32 32 0 0064 170.61v170.76A32 32 0 0079.89 369l152 88.46a48 48 0 0048.24 0l152-88.46A32 32 0 00448 341.37z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M69 153.99l187 110 187-110M256 463.99v-200"/></svg>');



    var settings = document.createElement("div");
    settings.className = "content-wrapper";
    el.appendChild(settings);
}


function createButton(title, svg) {
    var b = document.createElement("input");
    b.type = "radio";
    b.id = title;
    b.name = "menu-page";
    
    var wr = document.body.querySelector("#settings-pane > .side-bar > .wrapper");

    wr.appendChild(b);
    
    var lab = document.createElement("label");
    lab.setAttribute("for", title);
    lab.innerHTML = svg;
    wr.appendChild(lab);


    b.addEventListener("change", (e)=>{
        eval(b.id + "()");
    })


    return {input: b, label: lab};
}

function cleanPane() {
    var wr = document.getElementById("settings-pane").querySelector(".content-wrapper");
    wr.innerHTML = "";
    return wr;
}

var bindEditDat;

async function Shortcuts() {
    var wr = cleanPane();
    
    var cont = document.createElement("div");
    cont.className = "inner";
    var t = document.createElement("h1");
    t.className = "title";
    t.innerText = "Keyboard Shortcuts";

    cont.appendChild(t);

    wr.appendChild(cont);


    var binds = document.createElement("div");
    binds.className = "keybinds";
    cont.appendChild(binds);

    var config = await fetch();
    config = JSON.parse(config);

    config.keybinds = config.keybinds || require("../../resources/standardShortuts.json");

    //Display the keybinds
    for(x of config.keybinds.shortcuts) {
        displayBind(x);
    }



    function displayBind(bind) {
        var el = document.createElement("div");
        el.classList = "keybind";
        binds.appendChild(el);

        var name = document.createElement("span");
        name.classList = "name";
        name.innerText = bind.title;

        var desc = document.createElement("span");
        desc.classList = "description";
        desc.innerText = bind.desc;

        el.appendChild(name);
        el.appendChild(desc);


        var conn = document.createElement("div");
        conn.classList = "connector";
        el.appendChild(conn);

        var keys = document.createElement("span");
        keys.classList = "keys";
        keys.innerText = bind.combo;
        el.appendChild(keys);



        binds.appendChild(el);
        el.bindInfo = bind;

        keys.addEventListener("click", (e)=>{
            window.addEventListener("click", escapeKeyBindingByMouse);
            window.addEventListener("keydown", escapeKeyBinding);
            saveBinds();
            //Start editing this keybind
            bindEditDat = e.currentTarget.closest(".keybind").bindInfo;
            bindEditDat.el = e.currentTarget;
            
            //Disable all previous keybind setting functions
            window.removeEventListener("keydown", registerBind)
            var other = e.currentTarget.closest(".keybinds").getElementsByClassName("flash");
            for(x of other) {
                x.classList.remove("flash");
            }

            if(!bindEditDat) return;

            //Temporarily remove the keybind handler
            window.removeEventListener("keydown", handleShortCut);

            //Add effect to keybind element
            e.currentTarget.classList.add("flash");

            //Add bind event listener
            window.addEventListener("keydown", registerBind);

        })
    }
}

function escapeKeyBindingByMouse(e) {
    var par = document.querySelector("#settings-pane > div.content-wrapper > div > div.keybinds");
    var bind = par.getElementsByClassName("flash")[0];
    console.log(bind, e.target)
    if(e.target != bind) {
        deselectKeyBind();
        window.removeEventListener("click", escapeKeyBindingByMouse);

    }

}

function escapeKeyBinding(e) {
    if(e.key != "Escape" && e.key != "Enter") return;
    deselectKeyBind();
}

function deselectKeyBind() {
    saveBinds();
    enablebinds();
    var par = document.querySelector("#settings-pane > div.content-wrapper > div > div.keybinds");
    var binds = par.getElementsByClassName("keybind");
    for(x of binds) {
        x.querySelector(".keys").classList.remove("flash");
    }
    window.removeEventListener("keydown", registerBind)

}

function registerBind(e) {
    var str = e.key.toString().toUpperCase();
    //Add shift
    str = e.shiftKey&&e.keyCode!=16?"Shift+"+str:str; //16 => Shift
    //Add alt
    str = e.altKey&&e.keyCode!=18?"Alt+"+str:str; //18 => Alt
    //Add ctrl
    str = e.ctrlKey&&e.keyCode!=17?"Ctrl+" + str:str; //17 => Ctrl

    bindEditDat.el.innerText = str;

    bindEditDat.el.closest(".keybind").bindInfo.combo = str;
    console.log(bindEditDat.el)
}

async function saveBinds() {
    //Remove event listeners
    window.removeEventListener("keydown", registerBind)
    //Get binds
    var par = document.querySelector("#settings-pane > div.content-wrapper > div > div.keybinds");
    var binds = par.getElementsByClassName("keybind");
    console.log(binds)
    conf = {shortcuts:[]};
    for(x of binds) {
        conf.shortcuts.push(x.bindInfo);
    }

    //Save all the set binds
    var config = JSON.parse(await fetch());
    config.keybinds = conf; 
    console.log(config);
    ipcRenderer.invoke("save-config", JSON.stringify(config));

    //Save to localStorage
    localStorage.setItem("keybinds", JSON.stringify(config.keybinds));


}

function enablebinds() {
    window.addEventListener("keydown", handleShortCut);
}

function Importing() {
    var wr = cleanPane();
    
    var cont = document.createElement("div");
    cont.className = "inner";
    var t = document.createElement("h1");
    t.className = "title";
    t.innerText = "Importing";

    cont.appendChild(t);

    wr.appendChild(cont);

    var p = document.createElement("p");
    p.innerText = "Importing settings are not available";
    cont.appendChild(p)
    p.style = `
        color: white;
        opacity: 0.5;
    `
}

function Placeholder0() {
    var wr = cleanPane();

}

function Placeholder1(){
    var wr = cleanPane();

}








module.exports = { open }