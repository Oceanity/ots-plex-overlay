# ots-plex-overlay

Part of OceaniTS, this is a browser-based overlay designed to be used with OBS that will show whatever media you are currently playing on your Plex server for viewers.

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

## Advanced Setup (using existing Socket setup and listening on a new namespace)

The following will create an overlay at http://localhost:3052/custom-plex-overlay/

```js
const app = require("express")(),
    http = require("http").createServer(app),
    io = require("socket.io")(http);

http.listen(3052, () => {
    // HTTP callback code
});

const PlexOverlay = require("ots-plex-overlay")({
    app: app,
    http: http,
    io: io,
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

# Styling

You can alter some CSS variables in OBS's Custom CSS panel to alter how the overlay looks.

### Defaults

```css
:root {
    /* Background */
    --background: none;

    /* Text styling */
    --font-family: "Open Sans", sans-serif;
    --font-weight: bold;
    --text-max-width: unset;
    --text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0
            #000, 1px 1px 0 #000;
    --text-stroke: none;

    /* Album art */
    --cover-size: 85vh;
    --cover-margin: 5vh;
    --cover-background: rgba(0, 0, 0, 0.5);
    --cover-radius: 5vh;

    /* Track info */
    --title-color: #fff;
    --artist-color: #999;
    --album-color: #ccc;
    --time-color: #ccc;
    --duration-color: #999;

    /* progress bar */
    --progress-bar-bg: rgba(0, 0, 0, 0.5);
    --progress-bar-fg: red;
}
```
