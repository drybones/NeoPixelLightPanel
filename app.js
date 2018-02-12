#!/usr/bin/env node

var OPC = require('./opc')
var client = new OPC(process.env.FADECANDY_SERVER || 'localhost', 7890);
var model = OPC.loadModel(__dirname + '/layout.json');

var Shader = require('./shader');
var shader = new Shader(OPC, client, model);

var express = require('express');
var app = express();

var bodyParser = require('body-parser')

var storage = require('node-persist');

var shortid = require('shortid');

var mode = process.env.LIGHTPANEL_DEFAULT_MODE || null ;
var mode_value = process.env.LIGHTPANEL_DEFAULT_MODE_VALUE || null;

const WAVE_CONFIG_KEY = 'wave_config';

var wave_config = [
    {
        id: shortid.generate(),
        name: "default",
        wavelets: [
            {
                id: shortid.generate(),
                color: '#ffffff',
                freq: 0.3,
                lambda: 0.3,
                delta: 0.0,
                x: 0,
                y: 0,
                min: 0.2,
                max: 0.4,
            }      
        ]
    }
];

app.use(express.static(__dirname + '/site'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/js', express.static(__dirname + '/node_modules/bootstrap-slider/dist'));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap-slider/dist/css'));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    next();
  });

storage.init({interval: 1000}).then(function() {
    storage.getItem(WAVE_CONFIG_KEY).then(function(value) {
        if(value) {
            wave_config = value;
        } else {
            storage.setItem(WAVE_CONFIG_KEY, wave_config);
        }
    });
});

app.get('/api/wave_configs/', function(req,res) {
    res.json(wave_config.map(o => {
        return { id: o.id, name: o.name };
    }));
})

app.get('/api/wave_config/:config_id', function(req, res) {
    res.json(wave_config.find(o => o.id === req.params.config_id));
})
app.put('/api/wave_config/:config_id', function(req, res) {
    let index = wave_config.findIndex(o => o.id === req.params.config_id);
    if(index != -1) {
        wave_config[index] = req.body;
    }
    else
    {
        wave_config.push(req.body);
    }
    storage.setItem(WAVE_CONFIG_KEY, wave_config);
    res.send(200);
})
app.delete('/api/wave_config/:config_id', function(req, res) {
    let index = wave_config.findIndex(o => o.id === req.params.config_id);
    if(index != -1) {
        wave_config.splice(index, 1);
    }
    storage.setItem(WAVE_CONFIG_KEY, wave_config);
    
    res.send(200);
})

app.get('/api/all_wave_config/', function(req, res) {
    res.json(wave_config);
})
app.put('/api/all_wave_config/', function(req, res) {
    wave_config = req.body;
    storage.setItem(WAVE_CONFIG_KEY, wave_config);
    res.send(200);
})

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
            let config = wave_config.find(o => o.id === mode_value);
            if(config) {
                shader[mode](config);
            } else {
                console.log("Couldn't find config id "+mode_value);
                mode = "off";
            }
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
