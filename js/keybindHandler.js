const { fetch } = require("./loadFiles/config");
const { newNotification } = require("./notificationHandler");

async function activatebinds() {
    //Load keybinds into localStorage
    try {
        var conf = JSON.parse(await fetch());
    } catch (error) {
        console.error(error);
        newNotification("Could not load keybinds");
        return;
    }

    localStorage.setItem("keybinds", JSON.stringify(conf.keybinds));

    window.addEventListener("keydown", handleShortCut);
}

function handleShortCut(e) {
    //Get keybinds from localStorage
    var binds = JSON.parse(localStorage.getItem("keybinds"));
    //Generate shortcut string
    var str = e.key.toString().toUpperCase();
    //Add shift
    str = e.shiftKey&&e.keyCode!=16?"Shift+"+str:str; //16 => Shift
    //Add alt
    str = e.altKey&&e.keyCode!=18?"Alt+"+str:str; //18 => Alt
    //Add ctrl
    str = e.ctrlKey&&e.keyCode!=17?"Ctrl+" + str:str; //17 => Ctrl


    //Check if the keybind string matches with one of the predefined keybinds
    var index = binds.shortcuts.findIndex(p => p.combo == str);
    if(index==-1) return;

    var id = binds.shortcuts[index].id;
    //Do different things for each id

    /*

        0 => Toggle pin mode
        1 => Open settings
        2 => Add files
        3 => Toggle grid mode
        
    */
   

    switch(id) {
        case 0:
            //Get program pin mode
            togglePinMode();
        break;
        case 1:
            openSettings();
        break;
        case 2:
            addFilesFromButton();
        break;
        case 3:
            toggleGridMode();
        break;
    }
}

module.exports = { activatebinds, handleShortCut };