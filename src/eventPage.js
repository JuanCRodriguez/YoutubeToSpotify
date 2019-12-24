let clientID = "2eb43b664be74eecb571825c5a1c1e23";
let secretID = "";
let scope = "playlist-modify-private playlist-read-private user-read-private user-read-email";

const redirectUri = chrome.identity.getRedirectURL("spotify");

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        switch (request.action) {
            case "launchOauth": {
                launchOauth(sendResponse);
                break;
            }
            case "showUserInfo": {
                showUserInfo(sendResponse);
                break;
            }
            case "fetchSong": {
                fetchSong(request, sendResponse);
                break;
            }
            case "refreshToken": {
                refreshToken(sendResponse);
                break;
            }
            case "getPlaylists": {
                getPlaylists(sendResponse);
                break;
            }

            case "addToPlaylist": {
                addToPlaylist(request, sendResponse);
                break;
            }
        }
        return true
    }
);

function saveAuthData(json) {
    let date = new Date();
    let obj = {
        "access_token": json.access_token,
        "timestamp": date,
    };

    if (json.refresh_token) {
        Object.assign(obj, {"refresh_token": json.refresh_token})
    }

    if (json.expires_in) {
        let expire_date = new Date();
        expire_date.setSeconds(date.getSeconds() + json.expires_in);
        Object.assign(obj, {
            "expires": expire_date.getTime()
        })
    }
    saveToLocal(obj);
}

function saveToLocal(object) {
    chrome.storage.local.set(object);
}

function showUserInfo(callback) {
    chrome.storage.local.get(["access_token"], function (d) {
        let url = "https://api.spotify.com/v1/me";
        let init = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                "Authorization": "Bearer " + d.access_token
            },
            method: "GET"
        };
        sendRequest(url, init).then(r => {
            return r
        }).then(r => {
            return r.json()
        }).then(r => {
            console.log(r);
            callback({
                name: r.display_name,
                img: r.images[0] ? r.images[0].url : "img/AvatarDefault.png"
            });
        }).catch(r => alert(r));

    });
}

function launchOauth(callback) {
    let url = new URL("https://accounts.spotify.com/authorize");
    url.searchParams.set("client_id", clientID);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scope);
    let body = new URLSearchParams();
    body.append("grant_type", "authorization_code");
    body.append("redirect_uri", redirectUri);

    chrome.identity.launchWebAuthFlow({
        url: url.href,
        interactive: true
    }, function (e) {
        let code = e.split("code=")[1];
        body.set("code", code);
        let init = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                "Authorization": "Basic " + btoa(clientID + ":" + secretID)
            },
            method: "POST",
            body: body
        };
        let requestURL = 'https://accounts.spotify.com/api/token';
        sendRequest(requestURL, init).then(r => {
            return r.json()
        }).then(r => {
            saveAuthData(r);
        }).then(
            callback({status: "ok"})
        ).catch(r => alert(r));
    })
}

function refreshToken(callback) {
    chrome.storage.local.get(["refresh_token"], function (d) {
        let requestURL = "https://accounts.spotify.com/api/token";
        let body = new URLSearchParams();
        body.append("grant_type", "refresh_token");
        body.append("refresh_token", d.refresh_token);
        let init = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                "Authorization": "Basic " + btoa(clientID + ":" + secretID)
            },
            method: "POST",
            body: body
        };
        sendRequest(requestURL, init).then(r => {
            return r.json()
        }).then(r => {
            saveAuthData(r)
        }).then(r => {
            callback({status: "ok"});
        }).catch(r => {
            console.log(r)
        });
    });
}

function fetchSong(request, callback) {
    chrome.storage.local.get(["access_token"], function (d) {
        let url = new URL("https://api.spotify.com/v1/search");
        url.searchParams.set("type", "track");
        url.searchParams.set("market", "AR");
        url.searchParams.set("q", request.query);
        let init = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                "Authorization": "Bearer " + d.access_token
            },
            method: "GET"
        };
        sendRequest(url, init).then(r => {
            return r
        }).then(r => {
            return r.json()
        }).then(r => {
            console.log(r);
            let song = r.tracks.items[0];
            if (song) {
                let href = song.uri;
                let img = song.album.images[1];
                console.log(song, href, img);
                let songName = getSongName(song);
                let demoSong = song.preview_url;
                callback({
                    songName: songName,
                    href: href,
                    img: img,
                    demoSong: demoSong,
                    query: request.query,
                    ok: true
                });
                return
            }
            callback({
                ok: false,
                query: request.query,
            })
        }).catch(r => callback({
            songName: request.songName,
            ok: false,
            error: r.toString()
        }));

    });
}

function getPlaylists(callback) {
    chrome.storage.local.get(["access_token"], function (d) {
        let url = "https://api.spotify.com/v1/me/playlists";
        let init = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                "Authorization": "Bearer " + d.access_token
            },
            method: "GET"
        };
        sendRequest(url, init).then(r => {
            return r
        }).then(r => {
            return r.json()
        }).then(r => {
            console.log(r);
            callback({
                ok: true,
                playlists: r.items
            });
        }).catch(r => {
            console.error(r);
        })
    });
}

function addToPlaylist(request, callback) {
    console.log(request);
    chrome.storage.local.get(["access_token"], function (d) {
        let url = new URL(`https://api.spotify.com/v1/playlists/${request.idPlaylist}/tracks`);
        url.searchParams.append("uris", request.songURI);
        let init = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                "Authorization": "Bearer " + d.access_token
            },
            method: "POST"
        };

        sendRequest(url, init).then(r => {
            return r
        }).then(r => {
            return r.json()
        }).then(r => {
            console.log(r);
            callback({
                ok: true,
            });
        }).catch(r => {
            console.error(r);
        })
    })
}

async function sendRequest(url, init) {
    return fetch(url, init).then(r => {
        return r;
    }).catch(r => {
        console.log(r);
        return {status: "error", error: r.text()}
    });
}

function getSongName(songJSON) {
    let artist = songJSON.artists.map(a => a.name).join(', ');
    return artist + ' - ' + songJSON.name
}