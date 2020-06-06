# NeoPixelLightPanel

Custom project for a web controlled NeoPixel light panel. The panel is made up of 8 half meter lengths of 60 pixel/m NeoPixel strips. Each of the 8 strips is controlled from a distinct channel on a Fadecandy board, connected to a RaspberryPi. The Pi runs the node.js app.

This is the API server and the animation backend that talks to the [Fadecandy server](https://github.com/scanlime/fadecandy). The UI to talk to this backend is at https://github.com/drybones/neopixel-light-panel-ui

Video demo at https://youtu.be/4FmCFS33W90

## Dev 
Use `node app.js` to run, or hit `F5` in VS Code.

## Prod
Driving the lights will require the FadeCandy server to be running. 

Currently using `/etc/rc.local` to do that, having copied the [rpi executable](https://github.com/scanlime/fadecandy/blob/master/bin/fcserver-rpi) and this repo's `fcserver.json` to `/user/local/bin`:
```
/usr/local/bin/fcserver /usr/local/bin/fcserver.json >/var/log/fcserver.log 2>&1 &
```

The backend is then also run from `/etc/rc.local` using:
```
export FADECANDY_SERVER=automation.local
node /home/pi/NeoPixelLightPanel/app.js &
```

## Config

`FADECANDY_SERVER` defaults to `localhost` (hardcoded to port `7890`).

You might need to change `"listen": ["127.0.0.1", 7890]` in `fcserver.json` to the actual hostname to make the FadeCandy server accessible remotely.