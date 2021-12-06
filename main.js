function analyzeFile(contents) {
    const songList = document.getElementById("songList");
    const songRepetitionList = document.getElementById("songRepetitionList");
    const listenTimeText = document.getElementById("listenTime");
    const timeDistributionChart = document.getElementById("timeDistribution");
    const timeDistributionText = document.getElementById("timeDistributionText");
    const fileResultDiv = document.getElementById("fileResults");

    while(songList.firstChild){
        songList.removeChild(songList.firstChild);
    }
    while(timeDistributionChart.firstChild){
        timeDistributionChart.removeChild(timeDistributionChart.firstChild);
    }

    let songArray = [];
    let sortedSongIndecesArray = []
    let repetitionArray = [];
    let singerArray = [];

    let totalTime = 0;
    let timeDistribution = new Array(24).fill(0);

    let contentArray = null;
    try {
        contentArray = JSON.parse(contents);
    } catch (err) {
        console.log('invalid JSON provided');
    }

    // Loop through all songs in file and save them to an object
    contentArray.forEach(song => {
        totalTime += song["msPlayed"];
        timeDistribution[parseInt(song["endTime"].substring(11,13))] += Math.round(song["msPlayed"]/1000);
        if (song["msPlayed"] > 2000) {
            if (songArray.indexOf(song["trackName"]) > -1){
                repetitionArray[songArray.indexOf(song["trackName"])] += 1;
            } else {
                songArray.push(song["trackName"]);
                repetitionArray.push(1);
                singerArray.push(song["artistName"]);
            }
        }
    });

    // Populate array with song indeces sorted by number of times listened to
    sortedSongIndecesArray = Array.from(Array(repetitionArray.length).keys())
      .sort((a, b) => repetitionArray[b] - repetitionArray[a]);

    // Loop through sorted array and add top # to unordered list
    for (let i = 0; i < 20; i++) {
        let node = document.createElement('li');
        node.innerHTML = songArray[sortedSongIndecesArray[i]] + "  (<i>" + singerArray[sortedSongIndecesArray[i]] + "</i>) <span style='float: right;'><b>" + repetitionArray[sortedSongIndecesArray[i]] + "</b></span>";
        songList.appendChild(node);
    }

    // Stats
    listenTimeText.innerHTML = "Total listen time: " + Math.round(totalTime/60000) + " min / " + Math.round(totalTime/60000/60) + " hours";

    // Set up time distribution graph
    let maxTimeInHour = 0;
    for (let i = 0; i < 24; i++) {
        if(timeDistribution[i] > maxTimeInHour) maxTimeInHour = timeDistribution[i];
    }
    for (let i = 0; i < 24; i++) {
        timeDistributionChart.innerHTML += "<div class='bar' style='height:" + Math.round(timeDistribution[i] * 180 / maxTimeInHour) +"px'></div>"
    }

    // Overview
    document.getElementById("topSong").innerHTML = songArray[sortedSongIndecesArray[0]];
    document.getElementById("topArtist").innerHTML = singerArray[sortedSongIndecesArray[0]];

    let client_id = 'CLIENT_ID';
    let client_secret = 'CLIENT_SECRET';
    let base64 = client_id + ':' + client_secret;

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            makeSearches(xmlHttp.response.access_token, songArray[sortedSongIndecesArray[0]], singerArray[sortedSongIndecesArray[0]]);
        }
    }
    xmlHttp.open("POST", 'https://accounts.spotify.com/api/token', true);
    xmlHttp.setRequestHeader("Authorization", 'Basic ' + window.btoa(client_id + ":" + client_secret));
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
    xmlHttp.withCredentials = true;
    xmlHttp.responseType = 'json';
    xmlHttp.send("grant_type=client_credentials");

    fileResultDiv.style.visibility = "visible";
}

// Search images
function makeSearches(t, topSong, topSongArtist) {
    let xmlHttp2 = new XMLHttpRequest();
    xmlHttp2.open("GET", "https://api.spotify.com/v1/search?q=track%3A"+topSong+"+artist%3A"+topSongArtist+"&type=track&limit=1", true);
    xmlHttp2.onreadystatechange = function(e) {
        if (xmlHttp2.readyState == 4) {
            if (xmlHttp2.status == 200) {
                let results = JSON.parse(xmlHttp2.response);
                document.getElementById("topSongImage").src = results.tracks.items[0].album.images[1].url;
            } else {
                document.getElementById("topSongImage").src = "def_song.jpg";
            }
        }
    }
    xmlHttp2.setRequestHeader("Authorization", 'Bearer ' + t);
    xmlHttp2.send();

    let xmlHttp3 = new XMLHttpRequest();
    xmlHttp3.open("GET", "https://api.spotify.com/v1/search?q=track%3A"+topSong+"+artist%3A"+topSongArtist+"&type=track&limit=1", true);
    xmlHttp3.onreadystatechange = function(e) {
        if (xmlHttp3.readyState == 4) {
            if (xmlHttp2.status == 200) {
                let results = JSON.parse(xmlHttp3.response);
                document.getElementById("topArtistImage").src = results.tracks.items[0].album.images[1].url;
            } else {
                document.getElementById("topArtistImage").src = "def_singer.jpg";
            }
        }
    }
    xmlHttp3.setRequestHeader("Authorization", 'Bearer ' + t);
    xmlHttp3.send();
}