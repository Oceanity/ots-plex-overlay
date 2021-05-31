const fs = require("fs"),
    {resolve} = require("path"),
    request = require("request"),
    packJSON = require("../package.json"),
    PlexAPI = require("plex-api"),
    Console = require("./Console"),
    Con = new Console("OTS Plex Overlay", "#9147FF");

// API Poll Rate
const delay = 350;

let queue = [];

class PlexReader {
    constructor(options = {}) {
        // Set up default parameters
        this.Params = {
            responseParser: parserFunction,
            options: {
                identifier: "79bcc7f4be0761161747eb0ee4b06778",
                product: "Plex Overlay by Oceanity",
                version: packJSON.version,
                deviceName: "OBS",
            },
        };

        // Set up user-defined parameters
        this.Params.cacheCovers = options.cacheCovers || false;
        this.Params.cachePath = resolve(process.cwd(), (options.cachePath || "cache/"));
        this.Params.coversUri = options.coversUri || "/covers";
        this.Params.username = options.username;
        this.Params.token = options.token;
        this.Params.hostname = options.hostname || "127.0.0.1";
        this.Params.port = options.port || 32400;
        this.Params.encrypted = options.encrypted || false;

        // If no token provided, link user to article on finding token
        if (!this.Params.token) {
            throw Error(
                "`token` not defined, please input the token you are given on Plex. To learn more, visit https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/"
            );
        }
        // If no username provided, tell user to input
        if (!this.Params.username) {
            throw Error(
                "`username` not defined, please input the username of the user you want to track"
            );
        }

        // Initialize Client
        this.Client = new PlexAPI(this.Params);

        // Create Covers directory if it does not exist
        if (!fs.existsSync(this.Params.cachePath)){
            Con.Log("Plex Covers directory does not exist, creating...");
            fs.mkdirSync(this.Params.cachePath, {recursive: true}, (err) => {
                if (err) throw err;
            });
        }
    }

    Get(data, callback) {
        const {
            username
        } = this.Params;

        // If no optional arguments
        if (typeof data === "function") {
            callback = data;
            data = {};
        }
        // Set defaults if they don't exist
        if (data === undefined) data = {};
        if (data.offset === undefined) data.offset = 0;
        if (data.offsetPing === undefined) data.offsetPing = 0;
        this.Client.query("/status/sessions").then(
            (response) => {
                const {
                    Metadata
                } = response.MediaContainer;
                if (Metadata) {
                    // Find first playing stream by user
                    let streams = Metadata.filter((e) => {
                        return (
                            e.Player.state === "playing" &&
                            e.User.title === username
                        );
                    });
                    if (streams.length) {
                        const {
                            duration,
                            viewOffset,
                            title,
                            Player,
                            originalTitle,
                            parentTitle,
                            thumb,
                        } = streams[0];
                        let durationInt = parseInt(duration);
                        data.playing = true;
                        // Update offset if mismatch
                        if (viewOffset != data.offsetPing) {
                            data.offsetPing = parseInt(viewOffset);
                            data.offset = data.offsetPing;
                        }

                        // Base64 Encode thumbnail image to avoid passing token to public
                        fetchThumb(this, thumb, data, (thumbURL) => {
                            // Update metadata
                            if (data.prevThumb !== thumb) {
                                data.prevThumb = thumb;
                                data.art = thumbURL;
                            }
                            if (data.duration !== durationInt)
                                data.duration = durationInt;
                            if (data.title !== title) data.title = title;
                            if (data.artist !== originalTitle)
                                data.artist = originalTitle;
                            if (data.album !== parentTitle)
                                data.album = parentTitle;
                            if (callback && typeof callback === "function") 
                                callback(data);
                            setTimeout(() => {
                                this.Get(data, callback);
                            }, delay);
                            return true;
                        });
                    } else nothingPlaying(this, data, callback);
                } else nothingPlaying(this, data, callback);
            },
            (err) => {
                const {
                    statusCode,
                    body
                } = err;
                throw Error(`Error ${statusCode}: ${body.toString("utf8")}`);
            }
        );
    }
} module.exports = PlexReader;

// Parse Plex data and convert to JSON
function parserFunction(response, body) {
    const bodyAsString = body.toString("utf8");
    return Promise.resolve(bodyAsString).then(JSON.parse);
}

// Set playing to false
function nothingPlaying(parser, data, callback) {
    data.playing = false;
    if (callback && typeof callback === "function") {
        callback(data);
    }
    setTimeout(() => {
        parser.Get(data, callback);
    }, delay);
}

// Encodes thumb to Base64 Image Data to avoid passing token to public-facing URL
function fetchThumb(parser, thumb, data, callback) {
    const {
        cachePath,
        cacheCovers,
        coversUri,
        token,
        hostname,
        port,
        encrypted
    } = parser.Params;
    if (thumb && data.prevThumb !== thumb) {
        let id = thumb.split("/").filter(s => s.match(/\d+/)).join(""),
            url = `http${encrypted ? "s" : ""}://${hostname}:${port}${thumb}?X-Plex-Token=${token}`;
            
        // Cached cover method
        if (cacheCovers) {
            let tempFilePath = `${cachePath}/${id}.processing.jpg`,
                filePath = `${cachePath}/${id}.jpg`,
                imageUri = `${coversUri}/${id}.jpg`;

            // If cached cover exists, return
            if (fs.existsSync(filePath)) {
                callback(imageUri);
                return true;
            }

            // If file is currently being written, pass from server URL instead to avoid broken image
            else if (fs.existsSync(tempFilePath)) {
                base64Encode(url, (data) => {
                    Con.Log(`Temp file exists, grabbing uncached version!`);
                    callback(data);   
                });
                return true;
            }

            // Else, create and handle cover file
            else {
                let file = fs.createWriteStream(tempFilePath);
            
                request.head(url, (err, res, body) => {
                    if (err) throw err;

                    // If cover is available, process
                    else if (res.statusCode === 200) {
                        request(url).pipe(file)
                        file.on("finish", () => {
                            file.close();
                        });
                        file.on("close", () => {
                            fs.rename(tempFilePath, filePath, () => {
                                Con.Log(`Moving ${tempFilePath} to ${filePath}`);
                                callback(imageUri);
                            });
                        });
                    }

                    // If cover unreachable, close file and callback null;
                    else {
                        file.close();
                        if (callback && typeof callback === "function") callback(null);
                    }
                });
            }
        }

        // Non-cached version (can cause hanging)
        else {
            Con.Log("Grabbing non-cached album cover");
            base64Encode(url, (data) => {
                callback(data);
            });
        }
    }
    else if (callback && typeof callback === "function") callback(null);
}

function base64Encode(url, callback) {
    request.get({
            url,
            encoding: null,
        },
        (error, resp, body) => {
            if (!error && resp.statusCode == 200) {
                if (callback && typeof callback === "function") {
                    callback(
                        `data:${
                            resp.headers["content-type"]
                        };base64,${Buffer.from(body).toString("base64")}`
                    );
                }
            }
        }
    );
}
