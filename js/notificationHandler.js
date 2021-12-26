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

module.exports = { newNotification };