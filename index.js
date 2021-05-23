const WebUI = require("./lib/WebUI"),
    PlexReader = require("./lib/PlexReader");

function Init(options) {
    options.plexReader = new PlexReader(options.plex);
    const ui = new WebUI(options);
}
module.exports = Init;
