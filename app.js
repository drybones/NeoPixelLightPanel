#!/usr/bin/env node

var OPC = new require('./opc')
var client = new OPC(process.env.FADECANDY_SERVER || 'localhost', 7890);
var model = OPC.loadModel(__dirname + '/layout.json');
var express = require('express');
var app = express();
var shaders = require('./shaders.js');

var NUM_PIXELS = 240;
var mode = process.env.LIGHTPANEL_DEFAULT_MODE || null ;
var mode_value = null;

app.use(express.static(__dirname + '/site'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

app.get('/mode/:mode/:mode_value', function (req, res) {
    mode = req.params.mode;
    mode_value = req.params.mode_value;
    console.log("mode set to '" + mode + " with value " + mode_value);
    res.send("mode set to '" + mode + " with value " + mode_value);
})

app.get('/mode/:mode', function (req, res) {
    mode = req.params.mode;
    mode_value = null;
    console.log("mode set to '" + mode + "'");
    res.send("mode set to '" + mode + "'");
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000')
})


function draw() {
    var millis = new Date().getTime();

    switch(mode) {
        case "off":
            for (var pixel = 0; pixel < NUM_PIXELS; pixel++)
            {
                client.setPixel(pixel, 0, 0, 0);
            }
            break;

        case "color":
            for (var pixel = 0; pixel < NUM_PIXELS; pixel++)
            {
                var rgb = hexToRgb(mode_value);
                if(rgb) {
                    client.setPixel(pixel, rgb.r, rgb.g, rgb.b);
                } else {
                    client.setPixel(pixel, 0, 0, 0);
                }
            }
            break;

        case "red_alert":
            for (var pixel = 0; pixel < NUM_PIXELS; pixel++)
            {
                var t = millis * 0.002;
                var red = 128 + 96 * Math.sin(t);

                client.setPixel(pixel, red, 0, 0);
            }
            break;

        case "rainbow":
            for(var pixel = 0; pixel < NUM_PIXELS; pixel++) {
                var h = Math.floor((256 * (pixel % 30) / 30.0 + millis * 0.1 + 3*pixel/30) % 256);
                var c = colorWheel(h);
                client.setPixel(pixel, c.r, c.g, c.b);
            }
            break;

        case "red_pulse":
            var options = {
                freq: 0.5,
                lambda: 0.3,
                min: {r: 32, g: 0, b: 0},
                max: {r: 224, g: 0, b: 0},
                delta: {r: 0.0, g: 0.0, b: 0.0}
            };
            client.mapPixels(function (p) {
                return shaders.pulse(p, options, millis);
            }, model);
            break;

        case "cool_pulse":
            var options = {
                freq: 0.2,
                lambda: 1.0,
                min: {r: 5, g: 22, b: 28},
                max: {r: 20, g: 80, b: 100},
                delta: {r: 0.2, g: -0.3, b: 0.0}
            };
            client.mapPixels(function (p) {
                return shaders.pulse(p, options, millis);
            }, model);
            break;

        case "wave":
            for (var pixel = 0; pixel < NUM_PIXELS; pixel++)
            {
                var t = (pixel % 30 + Math.floor(pixel/30)*0.3) * 0.2 - millis * 0.002;
                var red = 128 + 96 * Math.sin(t);
                var green = 128 + 96 * Math.sin(t + 0.1);
                var blue = 128 + 96 * Math.sin(t + 0.4);

                client.setPixel(pixel, red, green, blue);
            }
            break;

        case "sun":
            for(var pixel = 0; pixel < NUM_PIXELS; pixel++) {
                var x = (pixel % 30) - 14.5;
                var y = 1.0*(Math.floor(pixel / 30) - 3.5);
                var r = Math.sqrt(x*x + y*y);
                var size = 10.0 + Math.sin(millis * 0.001); 
                var red =  190 * (size-r)/size < 0 ? 0 : 128 * (size-r)/size;
                var green = 190 * (size*0.9-r)/(size*0.9) < 0 ? 0 : 128 * (size*0.9-r)/(size*0.9);
                var blue = 64 * (size*0.8-r)/(size*0.8) < 0 ? 0 : 128 * (size*0.8-r)/(size*0.8);
                red +=32; blue +=44; green +=32;
                client.setPixel(pixel, red, green, blue);
            }
            break;
            
        case "particle_trail":
            var time = 0.009 * millis;
            var numParticles = 50;
            var particles = [];

            particles[0] = {
                point: [],          // Arbitrary location
                intensity: 0.1,
                falloff: 0,         // No falloff, particle has infinite size
                color:OPC.hsv(time * 0.01, 0.3, 0.8)
            };

            for (var i = 1; i < numParticles; i++) {
                var s = i / numParticles;

                var radius = 0.2 + 0.8 * s;
                var theta = time + 8 * s;
                var x = 1.5 * radius * Math.cos(theta) + 1.0 * Math.sin(time * 0.05);
                var y = radius * Math.sin(theta + 10.0 * Math.sin(theta * 0.15));
                var hue = time * 0.01 + s * 0.2;

                particles[i] = {
                    point: [x, 0, y],
                    intensity: 50.0 / numParticles * s, // Assume at least 40 particles...
                    falloff: 100,
                    color: OPC.hsv(hue, 0.5, 0.8)
                };
            }

            client.mapParticles(particles, model);
            break;
    }
    if(mode)
    {
        client.writePixels();
    }
    if(mode == "off")
    {
        mode = null;
        console.log("Lights off. Stopping updates.")
    }
}


function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function colorWheel(WheelPos) {
  if(WheelPos < 85) {
   return { r: WheelPos * 3, g: 255 - WheelPos * 3, b: 0 };
  } else if(WheelPos < 170) {
   WheelPos -= 85;
   return { r: 255 - WheelPos * 3, g: 0, b: WheelPos * 3 };
  } else {
   WheelPos -= 170;
   return { r: 0, g: WheelPos * 3, b: 255 - WheelPos * 3 };
  } 
}

setInterval(draw, 10);
