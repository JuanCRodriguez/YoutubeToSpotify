function stripSong() {
    let lblSongName = document.querySelector("yt-formatted-string[class='style-scope ytd-video-primary-info-renderer'][force-default-style]");
    let forbiddenWords = ["ft.", "ft", "VIDEO", "FEAT", "//", " • "];
    let mapToList = [{src: "·", mapTo: "-"}];
    let songName = remove_accents(lblSongName.innerText);
    forbiddenWords.forEach(function (word) {
        songName = songName.replace(word, "").trim();
    });
    mapToList.forEach(function (object) {
        songName = songName.replace(object.src, object.mapTo).trim()
    });
    songName = songName.split("[")[0].split("(")[0];
    songName = songName.replace(/(?<![a-zA-Z])[·&-]+(?![a-zA-Z])/g, '').trim();
    return songName;
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "getSong") {
        let song = stripSong();
        console.log(song);
        sendResponse({query: song})
    }
    return true;
});


function remove_accents(strAccents) {
    strAccents = strAccents.split('');
    let strAccentsOut = [];
    let strAccentsLen = strAccents.length;
    let accents = "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž";
    let accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";
    for (let y = 0; y < strAccentsLen; y++) {
        if (accents.indexOf(strAccents[y]) !== -1) {
            strAccentsOut[y] = accentsOut.substr(accents.indexOf(strAccents[y]), 1);
        } else
            strAccentsOut[y] = strAccents[y];
    }
    strAccentsOut = strAccentsOut.join('');

    return strAccentsOut;
}