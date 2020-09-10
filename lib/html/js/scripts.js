$(function () {
    // Get vars from URL
    let vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
        vars[key] = value;
    });

    // Consts
    const body = $("body"),
        art = $("#art-image"),
        title = $("#track-title"),
        artist = $("#track-artist"),
        album = $("#track-album"),
        curTime = $("#track-current"),
        totalTime = $("#track-total"),
        progress = $("#current-progress"),
        fadeSpeed = 250;

    let currentTrack = {};

    // Load socket
    const socket = io("/plex-overlay");

    // Announce to socket
    socket.on("connect", () => {
        console.log("[Connected to server]");
        socket.emit("handshake", {});
    });

    // On track info broadcast
    socket.on("track-info", (data) => {
        currentTrack = data;
        if (!data.playing) {
            body.fadeOut(fadeSpeed);
        } else {
            title.html(data.title || "");
            artist.html(data.artist || "");
            album.html(data.album || "");
            totalTime.html(` / ${TimeToSeconds(data.duration)}`);
            UpdateProgress(data.offset, data.duration);
            // If art is new allow loading, otherwise fade in
            if (data.art && data.art !== art.attr("src")) {
                art.attr("src", null);
                art.ready(function () {
                    body.fadeIn(fadeSpeed);
                });
                art.attr("src", data.art);
            } else {
                if (!data.art) art.attr("src", null);
                body.fadeIn(fadeSpeed);
            }
        }
    });

    // On Tick
    socket.on("tick", (offset) => {
        UpdateProgress(offset, currentTrack.duration);
    });

    // Update timer and progress bar
    function UpdateProgress(offset, duration) {
        curTime.html(TimeToSeconds(offset));
        progress.width(`${(offset * 100) / duration}%`);
    }

    function TimeToSeconds(time) {
        let seconds = Math.floor((time / 1000) % 60),
            minutes = Math.floor((time / (1000 * 60)) % 60),
            hours = Math.floor((time / (1000 * 60 * 60)) % 24),
            h = hours !== 0 && hours < 10 ? "0" + hours : hours,
            m = hours !== 0 && minutes < 10 ? "0" + minutes : minutes,
            s = seconds < 10 ? "0" + seconds : seconds;
        return `${h ? h + ":" : ""}${m}:${s}`;
    }
});