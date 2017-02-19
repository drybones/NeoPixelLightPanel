var Shader = function(OPC, client, model)
{
    this.OPC = OPC;
    this.client = client;
    this.model = model;
}

Shader.prototype.color = function(mode_value)
{
    var rgb = Shader.hexToRgb(mode_value) || {r: 0, g: 0, b: 0};
    this.client.mapPixels(function() {
        return [rgb.r, rgb.g, rgb.b];
    }, this.model);
}

Shader.prototype.rainbow = function()
{
    this._pulse({
        freq: 0.07,
        lambda: 0.6,
        min: {r: 0, g: 0, b: 0},
        max: {r: 100, g: 100, b: 100},
        delta: {r: 0.0, g: 2.09, b: 4.19} // 2*PI/3 offsets
    });
}

Shader.prototype.red_alert = function()
{
    this._pulse({
        freq: 0.5,
        lambda: 1000, // No shape, just pulsing
        min: {r: 32, g: 0, b: 0},
        max: {r: 255, g: 0, b: 0},
        delta: {r: 0.0, g: 0.0, b: 0.0}
    });
}

Shader.prototype.red_pulse = function()
{
    this._pulse({
        freq: 0.5,
        lambda: 0.3,
        min: {r: 32, g: 0, b: 0},
        max: {r: 224, g: 0, b: 0},
        delta: {r: 0.0, g: 0.0, b: 0.0}
    });
}

Shader.prototype.cool_pulse = function()
{
    this._pulse({
        freq: 0.2,
        lambda: 1.0,
        min: {r: 5, g: 22, b: 28},
        max: {r: 20, g: 80, b: 100},
        delta: {r: 0.2, g: -0.3, b: 0.0}
    });
}

Shader.prototype.dispersion = function()
{
    var millis = new Date().getTime();
    for (var pixel = 0; pixel < this.model.length; pixel++)
    {
        var t = (pixel % 30 + Math.floor(pixel/30)*0.3) * 0.2 - millis * 0.002;
        var red = 128 + 96 * Math.sin(t);
        var green = 128 + 96 * Math.sin(t + 0.1);
        var blue = 128 + 96 * Math.sin(t + 0.4);

        this.client.setPixel(pixel, red, green, blue);
    }
    this.client.writePixels();    
}

Shader.prototype.sun = function()
{
    var millis = new Date().getTime();
    for(var pixel = 0; pixel < this.model.length; pixel++) {
        var x = (pixel % 30) - 14.5;
        var y = 1.0*(Math.floor(pixel / 30) - 3.5);
        var r = Math.sqrt(x*x + y*y);
        var size = 10.0 + Math.sin(millis * 0.001); 
        var red =  190 * (size-r)/size < 0 ? 0 : 128 * (size-r)/size;
        var green = 190 * (size*0.9-r)/(size*0.9) < 0 ? 0 : 128 * (size*0.9-r)/(size*0.9);
        var blue = 64 * (size*0.8-r)/(size*0.8) < 0 ? 0 : 128 * (size*0.8-r)/(size*0.8);
        red +=32; blue +=44; green +=32;
        this.client.setPixel(pixel, red, green, blue);
    }
    this.client.writePixels();
}

Shader.prototype.particle_trail = function() 
{
    var millis = new Date().getTime();
    var time = 0.009 * millis;
    var numParticles = 50;
    var particles = [];

    particles[0] = {
        point: [],          // Arbitrary location
        intensity: 0.1,
        falloff: 0,         // No falloff, particle has infinite size
        color: this.OPC.hsv(time * 0.01, 0.3, 0.8)
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
            intensity: 50.0 / numParticles * s,
            falloff: 100,
            color: this.OPC.hsv(hue, 0.5, 0.8)
        };
    }

    this.client.mapParticles(particles, this.model);
}


Shader.prototype._pulse = function(options) {
    var millis = new Date().getTime();
    var _this = this;
    this.client.mapPixels(function (p) {
        var r = Math.sqrt(p.point[0]*p.point[0] + p.point[2]*p.point[2]);
        var theta = millis * 0.00628 * options.freq - r / options.lambda;
        var red = options.min.r + (options.max.r - options.min.r) * 0.5 * (Math.sin(theta + options.delta.r) + 1);
        var green = options.min.g + (options.max.g - options.min.g) * 0.5 * (Math.sin(theta + options.delta.g) + 1);
        var blue = options.min.b + (options.max.b - options.min.b) * 0.5 * (Math.sin(theta + options.delta.b) + 1);
        return [red, green, blue];
    }, this.model);
}

// Convenience functions

// http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
Shader.hexToRgb = function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


module.exports = Shader;


