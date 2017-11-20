#!/usr/bin/env node

var OPC = require('./opc')
var client = new OPC(process.env.FADECANDY_SERVER || 'localhost', 7890);
var model = OPC.loadModel(__dirname + '/layout.json');

var Shader = require('./shader');
var shader = new Shader(OPC, client, model);

var express = require('express');
var app = express();

var mode = process.env.LIGHTPANEL_DEFAULT_MODE || null ;
var mode_value = process.env.LIGHTPANEL_DEFAULT_MODE_VALUE || null;

var wave_config = {
    waves: [
        {
            color: 'ff0000',
            freq: 0.3,
            lambda: 0.1,
            delta: 0.0
        },
        {
            color: '00ff00',
            freq: 0.2,
            lambda: 0.2,
            delta: 0.0
        },        
        {
            color: '0000ff',
            freq: 0.1,
            lambda: 0.3,
            delta: 0.0
        }
    ]
};

app.use(express.static(__dirname + '/site'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

app.get('/mode/:mode/:mode_value', function (req, res) {
    mode = req.params.mode;
    mode_value = req.params.mode_value;
    console.log("Mode set to '" + mode + " with value " + mode_value);
    res.send("Mode set to '" + mode + " with value " + mode_value);
})

app.get('/mode/:mode', function (req, res) {
    mode = req.params.mode;
    mode_value = null;
    console.log("Mode set to '" + mode + "'");
    res.send("Mode set to '" + mode + "'");
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000')
})


function draw() {
    var millis = new Date().getTime();

    switch(mode) {
        case "color":
        case "rainbow":
        case "red_pulse":
        case "cool_pulse":
        case "particle_trail":
        case "embers":
        case "candy_sparkler":
        case "pastel_spots":
        case "dispersion":
        case "sun":
            shader[mode](mode_value);
            break;

        case "interactive_wave":
            shader[mode](wave_config);
            break;

        case "off":
        default:
            if(mode && (mode != "off")) {
                console.log("Unrecognised mode '" + mode + "'. Switching off.");
                mode = "off";
            }
            if(mode) {
                shader.color("000000");
                mode = null;
                console.log("Lights off. Stopping updates.")
            }
    }
}

setInterval(draw, 10);
