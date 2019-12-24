let audioPlayer = document.getElementById("audioPlayer");
let btnPlay = document.getElementById("btnPlay");
let volume = document.getElementById("volume");
let btnMute = document.getElementById('btnMute');

btnPlay.onclick = function (e) {
    if (this.classList.contains("fa-play")) {
        changeClass(this, "fa-play", "fa-pause");
        audioPlayer.play();
    } else {
        changeClass(this, "fa-pause", "fa-play");
        audioPlayer.pause();
    }
};

volume.oninput = function (e) {
    let value = this.value;
    audioPlayer.volume = value * 0.01;
    console.log(value, audioPlayer.volume);
    if (value > 1) {
        if(!btnMute.classList.contains("fa-volume-up"))
            changeClass(btnMute, "fa-volume-off", "fa-volume-up");
    }else{
        if(!btnMute.classList.contains("fa-volume-off"))
            changeClass(btnMute, "fa-volume-up", "fa-volume-off");
    }
};


btnMute.onclick = function (e) {
    if(!btnMute.classList.contains("fa-volume-off"))
        volume.value = "0";
        audioPlayer.volume = 0;
        changeClass(btnMute, "fa-volume-up", "fa-volume-off");

};


function changeClass(e, oldClass, newClass) {
    [oldClass, newClass].forEach(function (c) {
        e.classList.toggle(c);
    })
}
