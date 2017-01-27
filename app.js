#!/usr/bin/env node

// Simple red/blue fade with Node and opc.js

var OPC = new require('./opc')
var client = new OPC('raspberrypi.local', 7890);
var express = require('express');
var app = express();

var NUM_PIXELS = 240;
var mode = null;
var mode_value = null;

app.use(express.static('site'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

app.get('/mode/:mode/:mode_value', function (req, res) {
    mode = req.params.mode;
    mode_value = req.params.mode_value;
    console.log("mode set to '" + mode + " with value " + mode_value);
    res.send("mode set to 'color' with value " + mode_value);
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
        case "red_pulse":
            for(var pixel = 0; pixel < NUM_PIXELS; pixel++) {
                var x = (pixel % 30) - 14.5;
                var y = 1.5*(Math.floor(pixel / 30) - 3.5);
                var r = Math.sqrt(x*x + y*y);
                var red = 128 + 96 * Math.sin(millis * 0.002 - r * 0.2);
                client.setPixel(pixel, red, 0, 0);
            }
            break;
        case "cool_pulse":
            for(var pixel = 0; pixel < NUM_PIXELS; pixel++) {
                var x = (pixel % 30) - 14.5;
                var y = 1.5*(Math.floor(pixel / 30) - 3.5);
                var r = Math.sqrt(x*x + y*y);
                var red = 0.2 * (64 + 36 * Math.sin(millis * 0.002 - r * 0.2 + 0.1));
                var green = 0.8 * (64 + 36 * Math.sin(millis * 0.002 - r * 0.2 - 0.3));
                var blue = 64 + 36 * Math.sin(millis * 0.002 - r * 0.2);
                
                client.setPixel(pixel, red, green, blue);
            }
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

setInterval(draw, 30);
