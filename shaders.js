module.exports = {
    pulse: function (p, options, millis) {
        var r = Math.sqrt(p.point[0]*p.point[0] + p.point[2]*p.point[2]);
        var theta = millis * 0.00628 * options.freq - r / options.lambda;
        var red = options.min.r + (options.max.r - options.min.r) * 0.5 * (Math.sin(theta + options.delta.r) + 1);
        var green = options.min.g + (options.max.g - options.min.g) * 0.5 * (Math.sin(theta + options.delta.g) + 1);
        var blue = options.min.b + (options.max.b - options.min.b) * 0.5 * (Math.sin(theta + options.delta.b) + 1);
        return [red, green, blue];
    }
}


