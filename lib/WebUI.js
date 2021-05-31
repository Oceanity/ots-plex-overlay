const express = require("express"),
    {resolve} = require("path"),
    PlexReader = require("./PlexReader"),
    Console = require("./Console"),
    Con = new Console("OTS Plex Overlay", "#9147FF");

let clientCount = 0;

class WebUI {
    constructor(options = {}) {
        if (!options.plex) {
            Con.Error("No Plex parameters provided, unable to start Plex Reader");
        }
        this.plexReader = new PlexReader(options.plex);

        // User defined parameters
        this.path = options.path || "/plex-overlay";
        this.cachePath = resolve(process.cwd(), (options.cachePath || "cache/"));
        this.coversUri = options.coversUri || "/covers";
        this.port = options.port || 3032;

        // If existing app provided, serve from that, otherwise create new
        if (options.app && options.http && options.io) {
            this.app = options.app;
            this.http = options.http;
            this.io = options.io;
            Con.Log(`Attached to existing Express server, navigate to ${this.path}/ on the address it is using`);
        } else {
            this.app = express();
            this.http = require("http").createServer(this.app);
            this.io = require("socket.io")(this.http);
            this.http.listen(this.port, () => {
                Con.Log(
                    `Existing server not provided, started local Express server at http://localhost:${this.port}/plex-overlay/`
                );
            });
        }

        // Serve page
        this.app.use(this.coversUri, express.static(`${process.cwd()}/cache`));
        this.app.use(this.path, express.static(`${__dirname}/html/`));

        // Create socket io connection and start listening on namespace
        this.sockets = this.io.of("/plex-overlay");

        this.sockets.on("connection", (socket) => {
            socket.on("handshake", (data) => {
                Con.Log(`Client Connected, current clients: ${++clientCount}`);
                
                // Store previous track data to check current feed
                socket.previousTrack = "";
                socket.previousAlbum = "";
                socket.previousPlaying = false;
                socket.previousOffset = 0;

                // Get track data
                this.plexReader.Get((data) => {
                    if (socket) {
                        // Check if track state has changed since last update
                        if (socket.previousTrack !== data.title || socket.previousAlbum !== data.album) {
                            socket.previousTrack = data.title;
                            socket.previousAlbum = data.album;
                            socket.emit("track-info", data);
                        }
                        // Check if Play/Pause state has changed since last update
                        if (socket.previousPlaying !== data.playing) {
                            socket.previousPlaying = data.playing;
                            socket.emit("play-state", data.playing);
                        }
                        // Check if time has changed and update
                        if (socket.previousOffset !== data.offset) {
                            socket.previousOffset = data.offset;
                            socket.emit("tick", data.offset);
                        }
                    }
                });
            });
            socket.on("disconnect", (data) => {
                Con.Log(`Client Disconnected, current clients: ${--clientCount}`);
            });
        });
    }
}
module.exports = WebUI;
