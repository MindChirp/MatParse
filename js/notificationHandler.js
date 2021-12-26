function newNotification(content) {
    var el = document.createElement("div");
    el.className = "sidebar-notification smooth-shadow";

    var t = document.createElement("span");
    t.innerText = content;

    el.appendChild(t);

    var par = document.querySelector("#program-wrapper > div.explorer-wrapper > div.side-bar.frontpage > div.options-wrapper");
    par.appendChild(el);

    setTimeout(()=>{
        el.style.animation = "none";
        el.style.animation = "slide-out-notification 150ms ease-in-out both";
        setTimeout(()=>{
            el.parentNode.removeChild(el);
        }, 150)
    },5000)
}

function newBannerNotification(content, config) {
    var dummyConfig;
    if(config) {

        dummyConfig = {
            ...(!("persistent" in config)) && {persistent: false},
            ...(!("buttons" in config)) && {buttons: undefined},
        }
    } else {
        dummyConfig = {persistent: false, buttons: undefined}
    }

    config = config || dummyConfig;

    var el = document.createElement("div");
    el.className = "browser-notification smooth-shadow";

    el.close = function(){
        el.style.animation = "none";
        el.style.animation = "slide-out-notification 150ms ease-in-out both";
        setTimeout(()=>{
            el.parentNode.removeChild(el);
        }, 150);
    }

    var t = document.createElement("span");
    t.innerHTML = content;

    el.appendChild(t);

    var par = document.querySelector("#program-wrapper > div.explorer-wrapper > div.browser.frontpage");
    par.appendChild(el);

    if(!config.persistent) {
        setTimeout(()=>{
            el.style.animation = "none";
            el.style.animation = "slide-out-notification 150ms ease-in-out both";
            setTimeout(()=>{
                el.parentNode.removeChild(el);
            }, 150)
        },5000)
    } else {
        //create a cross
        var close = document.createElement("button");
        close.className = "close";
        close.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><title>Close</title><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M368 368L144 144M368 144L144 368"/></svg>';
        el.appendChild(close)

        close.addEventListener("click", (e)=>{
            e.currentTarget.closest(".browser-notification").close();
        })
    }


    //Append buttons
    if(config.buttons) {

        var bWr = document.createElement("div");
        bWr.className = "button-wrapper";
        el.appendChild(bWr);

        for(let i = 0; i < config.buttons.length; i++) {
            var b = config.buttons[i];

            var button = document.createElement("button");
            button.className = "banner-action-button";

            button.addEventListener("click", ()=>{
                eval(b.click.toString());
                if(b.close) {
                    //Close the notification when button is clicked
                    el.close();
                }
            });



            button.innerText = b.value;
            bWr.appendChild(button);
        }
    }

}


module.exports = { newNotification, newBannerNotification };