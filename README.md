# ots-plex-overlay

Part of OceniTS, this is a browser-based overlay designed to be used with OBS that will show whatever media you are currently playing on your Plex server for viewers.

# Usage

### require("ost-plex-overlay")([options])

Before using Plex Overlay you will need to [download and install Plex Media Server](https://www.plex.tv/media-server-downloads/) and [get the Plex token](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/) associated with your account.

## Simple Setup

The following will create an overlay at http://localhost:3032/plex-overlay/

```js
const plexOverlay = require("ost-plex-overlay")({
    port: 3032,
    plex {
        hostname: "127.0.0.1",
        username: "YourPlexUsername",
        token: "Y0uRPl3xT0kEN"
    }
})
```

## Advanced Setup (using existing Express app and custom port/path)

The following will create an overlay at http://localhost:3052/custom-plex-overlay/

```js
const app = require("express")(),
    http = require("http").createServer(app);

http.listen(3052, () => {
    // HTTP callback code
});

const PlexOverlay = require("ots-plex-overlay")({
    app: app,
    http: http,
    path: "/custom-plex-overlay",
    plex: {
        hostname: "127.0.0.1",
        username: "YourPlexUsername",
        token: "Y0uRPl3xT0kEN",
    },
});
```

# OBS Setup

Once you have the overlay successfully running, navigate to where it is being served by the HTTP server and copy the URL into a new Browser Source in OBS and resize as necessary, then when you play something on your Plex account you should see something similar to the following:

![](images/readme/example-obs.gif?raw=true)

The source will automatically fade out when you pause or stop media and fade in when you play again.
