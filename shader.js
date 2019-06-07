var Shader = function(OPC, client, model)
{
    this.OPC = OPC;
    this.client = client;
    this.model = model;
    this.particles = [];
    this.particles.mode = null;
}

Shader.prototype.interactive_wave = function(config)
{
    var millis = new Date().getTime();
    for (var pixel = 0; pixel < this.model.length; pixel++) {
        var p = this.model[pixel];
        var red = 0;
        var green = 0;
        var blue = 0;
        var displayWavelets = config.wavelets.filter(w => w.solo);
        if(displayWavelets.length === 0) {
            displayWavelets = config.wavelets;
        }
        displayWavelets.forEach(wavelet => {
            var rgb = this._wavelet(p, wavelet, millis);
            red += rgb[0];
            green += rgb[1];
            blue += rgb[2];
        })
        this.client.setPixel(pixel, red, green, blue);
    }
    this.client.writePixels();    
}
Shader.prototype._wavelet = function(p, options, millis) {
    var r = Math.sqrt((p.point[0]-options.x)*(p.point[0]-options.x) + (p.point[2]+options.y)*(p.point[2]+options.y)); // y coordinate is reversed for my layout
    var theta = millis * 0.00628 * options.freq - r / options.lambda;
    var rgb = Shader.hexToRgb(options.color);
    var red = rgb.r * (options.min + (options.max - options.min) * 0.5 * (Math.sin(theta + options.delta) + 1));
    var green = rgb.g * (options.min + (options.max - options.min) * 0.5 * (Math.sin(theta + options.delta) + 1));
    var blue = rgb.b * (options.min + (options.max - options.min) * 0.5 * (Math.sin(theta + options.delta) + 1));

    if(options.clip)
    {
        red = Math.min(Math.max(red,0),255);
        green = Math.min(Math.max(green,0),255);
        blue = Math.min(Math.max(blue,0),255);
    }

    return [red, green, blue];
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

Shader.prototype.embers = function() {
    var millis = new Date().getTime();

    if(!this.particles.mode || this.particles.mode != "embers") {
        this.particles = [];
        this.particles.mode = "embers";
        this.particles[0] = {
                point: [],
                intensity: 0.08,
                falloff: 0.0,        
                color: this.OPC.hsv(0.05, 0.8, 1.0)
        }
    }

    for(var i = 1; i < 30; i++) {
        var p = this.particles[i];
        if(!p || !p.born) {
            p = {
                origin: [Math.random() * 8.0 - 4.0, 0, Math.random() * 2.0 - 0.0],
                point: [],
                intensity: 0.0,
                falloff: 20.0,        
                color: this.OPC.hsv(Math.random() * 0.11 - 0.02, 1.0, 1.0),
                velocity: [0.6 * (Math.random() - 0.5), 0, -(Math.random() * 0.4 + 0.2)],
                born: millis,
                death: millis + Math.random() * 5000 + 3000
            }
            this.particles[i] = p;
        }
        p.point[0] = p.origin[0] + p.velocity[0] * (millis - p.born) / 1000;
        p.point[1] = p.origin[1] + p.velocity[1] * (millis - p.born) / 1000;
        p.point[2] = p.origin[2] + p.velocity[2] * (millis - p.born) / 1000;
        p.intensity = 0.7 * Math.sin((millis - p.born)/(p.death - p.born) * Math.PI);

        if(millis > p.death) {
            p.intensity = 0.0;
            p.born = null;
        }
    }

    this.client.mapParticles(this.particles, this.model);    
}

Shader.prototype.candy_sparkler = function() {
    var millis = new Date().getTime();

    if(!this.particles.mode || this.particles.mode != "candy_sparkler") {
        this.particles = [];
        this.particles.mode = "candy_sparkler";
        this.particles[0] = {
                point: [],
                intensity: 0.02,
                falloff: 0.0,        
                color: this.OPC.hsv(0.0, 0.0, 1.0)
        }
    }

    for(var i = 1; i < 50; i++) {
        var p = this.particles[i];
        if(!p || !p.born) {
            var v_r = Math.random() * 0.5 + 1.5;
            var v_theta = Math.random() * 2 * Math.PI;
            var delay = p ? 0 : Math.random() * 2000; // First time through don't start them all immediately
            p = {
                origin: [0, 0, 0],
                point: [],
                falloff: 30.0,        
                color: this.OPC.hsv(Math.random() * 1.0, 1.0, 1.0),
                velocity: [1.5 * v_r * Math.cos(v_theta), 0, 1.0 * v_r * Math.sin(v_theta)],
                born: millis + delay,
                death: millis + delay + Math.random() * 1000 + 1000
            }
            this.particles[i] = p;
        }
        p.point[0] = p.origin[0] + p.velocity[0] * (millis - p.born) / 1000;
        p.point[1] = p.origin[1] + p.velocity[1] * (millis - p.born) / 1000;
        p.point[2] = p.origin[2] + p.velocity[2] * (millis - p.born) / 1000;
        var life_fraction = (millis - p.born)/(p.death - p.born);
        var pivot = 0.25;
        if(life_fraction < pivot) {
            p.intensity = Math.max(life_fraction/pivot, 0); // Can be < 0 if the particle birth is delayed
        } else {
            p.intensity = 1.0-(life_fraction-pivot)/(1-pivot);
        }

        if(millis > p.death) {
            p.intensity = 0.0;
            p.born = null;
        }
    }

    this.client.mapParticles(this.particles, this.model);    
}

Shader.prototype.pastel_spots = function() {
    var millis = new Date().getTime();

    var hue = millis/70000 % 1.0;

    if(!this.particles.mode || this.particles.mode != "pastel_spots") {
        this.particles = [];
        this.particles.mode = "pastel_spots";
        this.particles[0] = {
            point: [],
            intensity: 0.0,
            falloff: 0.0
        }
    }
    this.particles[0].color = this.OPC.hsv(hue, 1.0, 1.0);

    var transit_radius = 9.0;
    var avg_speed = 0.7;

    for(var i = 1; i < 10; i++) {
        var p = this.particles[i];
        if(!p || !p.born) {
            // Start particle on circumference outside the viewport, aim inwards
            var theta = Math.random() * 2 * Math.PI;
            var v_r = avg_speed + 0.2 * (Math.random()-0.5);
            var v_theta = theta + Math.PI + Math.random() * 0.1;
            var delay = p ? 0 : Math.random() * transit_radius*2.0/avg_speed*1000; // First time through don't start them all immediately
            p = {
                origin: [transit_radius * Math.cos(theta), 0, transit_radius * Math.sin(theta)],
                velocity: [v_r * Math.cos(v_theta), 0, v_r * Math.sin(v_theta)],
                point: [],
                color: this.OPC.hsv(0.2 * (Math.random()-0.5) + hue, 0.4, 1.0),
                intensity: 0.6,
                born: millis + delay,
                death: millis + delay + transit_radius*2.0/v_r*1000
            }
            this.particles[i] = p;
        }
        p.point[0] = p.origin[0] + p.velocity[0] * (millis - p.born) / 1000;
        p.point[1] = p.origin[1] + p.velocity[1] * (millis - p.born) / 1000;
        p.point[2] = p.origin[2] + p.velocity[2] * (millis - p.born) / 1000;
        p.intensity = 0.6;

        var dist = Math.sqrt(p.point[0]^2 + p.point[1]^2 + p.point[2]^2);
        if(p.death < millis) {
            p.intensity = 0.0;
            p.born = null;
        }
    }

    this.client.mapParticles(this.particles, this.model, Shader.discParticle);    
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

Shader.discParticle = function(distanceSq, intensity, falloff) {
    var size = 0.3;
    var feather = 0.6;  
    if(distanceSq <= size) {
        return intensity
    } else if (distanceSq <= size + feather) {
        return intensity * (1-(distanceSq - size)/(feather))
    } else {
        return 0;
    }
}

module.exports = Shader;