let btnLaunchOauth = document.getElementById('btnLaunchOauth');
let btnRefreshToken = document.getElementById("btnRefreshToken");
let btnGetSong = document.getElementById("btnGetSong");
let lblName = document.getElementById("lblName");
let divNotLogged = document.getElementById("divNotLogged");
let divloggedIn = document.getElementById("divloggedIn");
let divTokenExpired = document.getElementById("divTokenExpired");
let divSongFound = document.getElementById("divSongFound");
let lblSongFound = document.getElementById("lblSongFound");
let divSongNotFound = document.getElementById("divSongNotFound");
let txtSongQuery = document.getElementById("txtSongQuery");
let btnRetryQuery = document.getElementById("btnRetryQuery");
let imgSong = document.getElementById("imgSong");
let avatar = document.getElementById("avatar");
let errSongNotFound = document.getElementById("ErrSongNotFound");
let btnManualSearch = document.getElementById("btnManualSearch");
let divHoverPlaylist = document.getElementById("divHoverPlaylist");
let divPlaylists = document.getElementById("divPlaylists");
let dropdownIcon = document.getElementById("dropdownIcon");
let btnShowPlaylists = document.getElementById("btnShowPlaylists");

btnRefreshToken.onclick = refreshToken;
btnGetSong.onclick = getSong;
btnLaunchOauth.onclick = launchOauth;
btnRetryQuery.onclick = function (e) {
    if (txtSongQuery.textContent) {
        sendSong(txtSongQuery.textContent);
    } else {
        showRetryForm("");
    }

};
btnManualSearch.onclick = showManualSearch;

btnShowPlaylists.onclick = function () {
    dropdownIcon.classList.toggle("fa-chevron-down");
    dropdownIcon.classList.toggle("fa-chevron-up");
    divPlaylists.classList.toggle("w3-hide")
};

function launchOauth() {
    chrome.runtime.sendMessage({
        action: 'launchOauth',
    }, function (response) {
        if (response.status === "ok") {
            setTimeout(function () { // sometimes spotify api takes a while to login
                location.reload()
            }, 1000);
        }
    });
}

function showUserInfo() {
    chrome.runtime.sendMessage({
        action: 'showUserInfo',
    }, function (re) {
        lblName.innerText = re.name;
        avatar.src = re.img;
    });
}

function refreshToken() {
    chrome.runtime.sendMessage({
        action: 'refreshToken',
    }, function (response) {
        if (response) {
            console.log(response);
            location.reload();
        }
    });
}


function sendSong(query) {
    chrome.runtime.sendMessage({
        action: 'fetchSong',
        query: query
    }, function (response) {
        console.log(response);
        if (response.ok) {
            showSong(response);
            getPlaylists();
        } else {
            showRetryForm(response.query);
        }
    });
}

function getSong() {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "getSong"}, function (response) {
            console.log(response);
            if (response) {
                sendSong(response.query);
            }
        });
    });

}

function getPlaylists() {
    chrome.runtime.sendMessage({
        action: 'getPlaylists',
    }, function (response) {
        console.log(response);
        if (response.ok) {
            showPlaylists(response.playlists);
        }
    });
}

function openURI(e) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.executeScript(tabs[0].id, {code: `location.href = '${e.target.href}'`});
    });
}

function showSong(response) {
    divSongNotFound.style.display = "none";
    txtSongQuery.innerText = response.query;
    lblSongFound.textContent = response.songName;
    lblSongFound.href = response.href;
    lblSongFound.onclick = openURI;
    imgSong.src = response.img.url;
    divSongFound.style.display = "";
    audioPlayer.src = response.demoSong;
    divHoverPlaylist.style.display = "";


}

function showRetryForm(songName,) {
    showManualSearch();
    errSongNotFound.style.display = "";
    btnRetryQuery.innerText = "Retry";
    txtSongQuery.innerText = songName;

}

function showManualSearch() {
    divSongFound.style.display = "none";
    divSongNotFound.style.display = "";
    errSongNotFound.style.display = "none";
    btnRetryQuery.innerText = "Search";
}

function addToPlaylist(e) {
    console.log(e);
    if (confirm(`Do you want to add ${lblSongFound.textContent} to ${e.currentTarget.textContent}?`)) {
        chrome.runtime.sendMessage({
            action: 'addToPlaylist',
            idPlaylist: e.currentTarget.id,
            songURI: lblSongFound.href
        }, function (response) {
            console.log(response);
            if (response.ok) {
                alert("Added to playlist")
            }else{
                alert("Error");
                console.log(response)
            }
        });
    }
}

function showPlaylists(playlists) {
    playlists.forEach(function (playlist) {
        let img = document.createElement("img");
        img.src = playlist.images.length === 0 ? "img/defaultPlaylist.png" : playlist.images[0].url;
        img.classList.add("w3-left", "w3-margin-right");
        img.style.display = "inline-block";
        img.style.height = "50px";
        img.style.width = "50px";
        img.alt = playlist.name;

        let p = document.createElement("p");
        p.classList.add("w3-left-align");
        p.textContent = playlist.name;

        let anchor = document.createElement("a");
        anchor.href = playlist.uri;
        anchor.id = playlist.id;
        anchor.onclick = addToPlaylist;
        anchor.classList.add("w3-block", "w3-button");
        anchor.appendChild(img);
        anchor.appendChild(p);

        let div = document.createElement("div");
        div.appendChild(anchor);

        let hr = document.createElement("hr");
        divPlaylists.appendChild(div);
        divPlaylists.appendChild(hr);
    })
}

window.onload = function (e) {
    chrome.storage.local.get(["expires", "access_token"], function (d) {
        if (!d.access_token) { // user is not logged
            divNotLogged.style.display = "";
            return
        }
        if (new Date().getTime() >= d.expires) { // user token expired
            divTokenExpired.style.display = "";
            return
        }
        divloggedIn.style.display = ""; //everything ok
        showUserInfo();
    });
};


