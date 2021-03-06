const { ipcRenderer } = require("electron");

function setupProgram() {
    return new Promise((resolve)=>{

        var config = {
            filePath: "",
            stayOnTop: true
        }

        localConfig = {
            resolutions: ["2K"]
        }

        //Set some configs into the localStorage
        localStorage.setItem("localConfig", JSON.stringify(localConfig));
        localStorage.setItem("preview", JSON.stringify({type: 0}));

        var menu = document.createElement("div");
        menu.className = "setup-modal";
        
        document.body.appendChild(menu);

        var title = document.createElement("h1");
        title.innerText = "first time setup";

        menu.appendChild(title);

        var wr = document.createElement("div");
        wr.className = "filespaths";


        var t = document.createElement("h1");
        t.innerText = "1.";
        t.className = "step-title";
        wr.appendChild(t);

        var path = document.createElement("button");
        path.className = "files";
        path.innerText = "Select folder path"
        var out = document.createElement("label");
        out.className = "files-output";

        wr.appendChild(path);
        wr.appendChild(out);
        menu.appendChild(wr);

        path.addEventListener("click", async (e)=>{
            var filePath = await ipcRenderer.invoke("path-modal", "");
            if(filePath.length == 0) return;     
        
            out.innerText = filePath[0];

            config.filePath = filePath[0];
        })

        var finish = document.createElement("button");
        finish.innerText = "Finish setup";
        finish.className = "finish smooth-shadow";
        menu.appendChild(finish);

        finish.addEventListener("click", async (e)=>{
            if(config.filePath.length == 0) {
                setupNotification("Select an input folder");
                return;
            }
            
            //save the config
            try {
                var state = await ipcRenderer.invoke("save-config", JSON.stringify(config));
                console.log(state);
            } catch (error) {
                alert("Could not complete setup. Try again.");
            }
            menu.parentNode.removeChild(menu);
            resolve();
        })
    })

}

function setupNotification(cont) {
    var el = document.createElement("span");
    el.className = "setup-notification";
    el.innerText = cont;

    document.querySelector(".setup-modal").appendChild(el);

    setTimeout(()=>{
        el.parentNode.removeChild(el);
    }, 5000)
}

module.exports = { setupProgram };