const express = require("express"),
    PlexReader = require("lib/PlexReader");

let clientCount = 0;

class WebUI {
    constructor(options = {}) {
        if (!options.plex) {
            throw Error(
                "[Plex Overlay: No Plex parameters provided, unable to start Plex Reader]"
            );
        }
        this.reader = new PlexReader(options.plex);

        // User defined parameters
        this.path = options.path || "/plex-overlay";
        this.port = options.port || 3032;

        // If existing app provided, serve from that, otherwise create new
        if (options.app && options.http) {
            this.app = options.app;
            this.http = options.http;
            console.log(
                "[Plex Overlay: Attached to existing Express server, navigate to /plex-overlay/ on the address it is using]"
            );
        } else {
            this.app = express();
            this.http = require("http").createServer(this.app);
            this.http.listen(this.port, () => {
                console.log(
                    `[Plex Overlay: Existing server not provided, started local Express server at http://localhost:${this.port}/plex-overlay/]`
                );
            });
        }

        // Serve page
        this.app.use(this.path, express.static(`${__dirname}/html/`));

        // Create socket io connection and start listening on namespace
        this.io = require("socket.io")(this.http);
        this.sockets = this.io.of("/plex-overlay");

        this.sockets.on("connection", (socket) => {
            socket.on("handshake", (data) => {
                let previousTrack = "",
                    previousPlaying = null;
                console.log(
                    `[Plex Overlay: Client Connected, current clients: ${++clientCount}]`
                );
                this.reader.Get((data) => {
                    // Check if track state has changed since last update
                    if (previousTrack !== data.title) {
                        previousTrack = data.title;
                        socket.emit("track-info", data);
                    }
                    // Check if Play/Pause state has changed since last update
                    else if (previousPlaying !== data.playing) {
                        previousPlaying = data.playing;
                        socket.emit("track-info", data);
                    }
                    // Otherwise just update time
                    else {
                        socket.emit("tick", data.offset);
                    }
                });
            });
            socket.on("disconnect", (data) => {
                console.log(
                    `[Plex Overlay: Client Disconnected, current clients: ${--clientCount}]`
                );
            });
        });
    }
}
module.exports = WebUI;
