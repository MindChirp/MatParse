const { newNotification } = require("../../js/notificationHandler");


function handleResChange(el){
    //Get the localConfig


    //Get the value and state of the triggered element
    var type = el.id;
    var value = el.checked;

    if(!value) {
        var New = removeRes(type);
    } else {
        var New = addRes(type);
    }

    console.log(New)
    if(New.length == 0) {
        newNotification("Select at least one resolution")
    }

    var conf = JSON.parse(localStorage.getItem("localConfig"))
    conf.resolutions = New;
    localStorage.setItem("localConfig", JSON.stringify(conf))

}

function removeRes(type) {
    var conf = JSON.parse(localStorage.getItem("localConfig"));
    var res = conf.resolutions;    

    var ind = res.indexOf(type);
    res.splice(ind,1);

    return res;
}

function addRes(type) {
    var conf = JSON.parse(localStorage.getItem("localConfig"));
    var res = conf.resolutions;  
    
    res.push(type);
    return res;
}

module.exports = { handleResChange };