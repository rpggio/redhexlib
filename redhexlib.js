// http://www.redblobgames.com/grids/hexagons/

//
// Cube
// Three-value hex coordinate that simplifies calculations. 
//

var Cube = function (x, y, z) {
    this.v = [x, y, z];
};

Cube._directions = [
    [1, -1, 0],
    [1, 0, -1],
    [0, 1, -1],
    [-1, 1, 0],
    [-1, 0, 1],
    [0, -1, 1]
];

Cube.prototype = {
    toString: function () {
        return this.v.join(",");
    },

    equals: function (other) {
        return this.v[0] == other.v[0] && this.v[1] == other.v[1] && this.v[2] == other.v[2];
    },

    scale: function (f) {
        return new Cube(f * this.v[0], f * this.v[1], f * this.v[2]);
    },

    add: function (other) {
        return new Cube(this.v[0] + other.v[0], this.v[1] + other.v[1], this.v[2] + other.v[2]);
    },

    subtract: function (other) {
        return new Cube(this.v[0] - other.v[0], this.v[1] - other.v[1], this.v[2] - other.v[2]);
    },

    rotateLeft: function () {
        return new Cube(-this.v[1], -this.v[2], -this.v[0]);
    },

    rotateRight: function () {
        return new Cube(-this.v[2], -this.v[0], -this.v[1]);
    },

    length: function () {
        var len = 0.0;
        var g = 0;
        while (g < 3) {
            var i = g++;
            if (Math.abs(this.v[i]) > len) len = Math.abs(this.v[i]);
        }
        return len;
    },

    round: function () {
        var r = [];
        var sum = 0;
        var g = 0;
        while (g < 3) {
            var i = g++;
            r[i] = Math.round(this.v[i]);
            sum += r[i];
        }
        if (sum !== 0) {
            var e = [];
            var worst_j = 0;
            var h = 0;
            while (h < 3) {
                var j = h++;
                e[j] = Math.abs(r[j] - this.v[j]);
                if (e[j] > e[worst_j]) worst_j = j;
            }
            r[worst_j] = -sum + r[worst_j];
        }
        return new Cube(r[0], r[1], r[2]);
    },
    
    toHex: function () {
        return new Hex(this.v[0] || 0, this.v[2] || 0);
    }
};

//
// Grid
//

var Grid = function (scale, orientation, shape) {
    this.scale = scale;
    this.orientation = orientation;
    this.hexes = shape;
};

Grid.SQRT_3_2 = Math.sqrt(3) / 2;

Grid.boundsOfPoints = function (points) {
    var minX = 0.0, minY = 0.0, maxX = 0.0, maxY = 0.0;
    var g = 0;
    while (g < points.length) {
        var p = points[g];
        ++g;
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY};
};

Grid.hexagonalShape = function (size) {
    var hexes = [];
    var g1 = -size, g = size + 1;
    while (g1 < g) {
        var x = g1++;
        var g3 = -size, g2 = size + 1;
        while (g3 < g2) {
            var y = g3++;
            var z = -x - y;
            if (Math.abs(x) <= size && Math.abs(y) <= size && Math.abs(z) <= size) hexes.push(new Cube(x, y, z));
        }
    }
    return hexes;
};

Grid.prototype = {
    hexToCenter: function (cube) {
        if (this.orientation) {
            return new ScreenCoordinate(this.scale * (Grid.SQRT_3_2 * (cube.v[0] + 0.5 * cube.v[2])), this.scale * (0.75 * cube.v[2]));
        }
        return new ScreenCoordinate(this.scale * (0.75 * cube.v[0]), this.scale * (Grid.SQRT_3_2 * (cube.v[2] + 0.5 * cube.v[0])));
    },

    bounds: function () {
        var me = this;
        var centers = this.hexes.map(function (hex) {
            return me.hexToCenter(hex);
        });
        var b1 = Grid.boundsOfPoints(this.polygonVertices());
        var b2 = Grid.boundsOfPoints(centers);
        return { minX: b1.minX + b2.minX, maxX: b1.maxX + b2.maxX, minY: b1.minY + b2.minY, maxY: b1.maxY + b2.maxY};
    },

    polygonVertices: function () {
        var points = [];
        var g = 0;
        while (g < 6) {
            var i = g++;
            var angle = 2 * Math.PI * (2 * i - (this.orientation ? 1 : 0)) / 12;
            points.push(new ScreenCoordinate(0.5 * this.scale * Math.cos(angle), 0.5 * this.scale * Math.sin(angle)));
        }
        return points;
    }
};

//
// Hex
//

var Hex = function (q, r) {
    this.q = q;
    this.r = r;
};

Hex.prototype = {
    toString: function () {
        return this.q + ":" + this.r;
    },

    toCube: function () {
        return new Cube(this.q, -this.r - this.q, this.r);
    }
};

//
// ScreenCoordinate
//

var ScreenCoordinate = function (x, y) {
    this.x = x;
    this.y = y;
};

ScreenCoordinate.prototype = {
    equals: function (p) {
        return this.x == p.x && this.y == p.y;
    },

    toString: function () {
        return this.x + "," + this.y;
    },

    length_squared: function () {
        return this.x * this.x + this.y * this.y;
    },

    length: function () {
        return Math.sqrt(this.length_squared());
    },

    normalize: function () {
        var d = this.length();
        return new ScreenCoordinate(this.x / d, this.y / d);
    },

    scale: function (d) {
        return new ScreenCoordinate(this.x * d, this.y * d);
    },

    rotateLeft: function () {
        return new ScreenCoordinate(this.y, -this.x);
    },

    rotateRight: function () {
        return new ScreenCoordinate(-this.y, this.x);
    },

    add: function (p) {
        return new ScreenCoordinate(this.x + p.x, this.y + p.y);
    },

    subtract: function (p) {
        return new ScreenCoordinate(this.x - p.x, this.y - p.y);
    },

    dot: function (p) {
        return this.x * p.x + this.y * p.y;
    },

    cross: function (p) {
        return this.x * p.y - this.y * p.x;
    },

    distance: function (p) {
        return this.subtract(p).length();
    }
};

//
// ScreenCoordinate
//

var Shape = function() {};

// (x, y) should be the center
// scale should be the distance from corner to corner
// orientation should be 0 (flat bottom hex) or 1 (flat side hex)
Shape.hexagon = function (scale, x, y, orientation) {
    var points = [];
    for (var i = 0; i < 6; i++) {
        var angle = 2 * Math.PI * (2*i - orientation) / 12;
        points.push(new ScreenCoordinate(x + 0.5 * scale * Math.cos(angle),
                y + 0.5 * scale * Math.sin(angle)));
    }
    return points;
};
