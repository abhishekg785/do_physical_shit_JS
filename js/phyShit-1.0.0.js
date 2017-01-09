(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
*  author : abhishek goswami ( Hiro )
*  abhishekg785@gmail.com
*
*  constraint.js : adding the constraint on the particles
 */

// DistanceConstraint -- constraints to the initial distance
// PinConstraint -- constrains to static/fixed points
// AngleConstraints -- contains 3 particles to an angle

var lineStrokeColor = 'd8dde2',
    PinConstraintRadius = 6,
    PinConstraintFillColor = 'rgba(0,153,255,0.1)',

    AngleConstraintStrokeColor = 'rgba(255,255,0,0.2)',
    AngleConstraintLineWidth = 5;


// class DistanceConstraint as a constructor
function DistanceConstraint(a, b, stiffness, distance) {
    this.a = a;
    this.b = b;
    this.distance = typeof distance != "undefined" ? distance : a.pos.sub(b.pos).length();
    this.stiffness = stiffness;
}

DistanceConstraint.prototype.relax = function(stepCoef) {
    var normal = this.a.pos.sub(this.b.pos);
    var m = normal.length2();
    normal.mutableScale(((this.distance*this.distance - m)/m)*this.stiffness*stepCoef);
    this.a.pos.mutableAdd(normal);
    this.b.pos.mutableSub(normal);
}

DistanceConstraint.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.a.pos.x, this.a.pos.y);
    ctx.lineTo(this.b.pos.x, this.b.pos.y);
    ctx.strokeStyle = lineStrokeColor;
    ctx.stroke();
}


// functions for pin constraint starts here

// PinConstraints cons having params:
// a : the point to work on
// pos : position where to set the point on the canvas
function PinConstraint(a, pos) {
    this.a = a;
    this.pos = (new Vec2()).mutableSet(pos);
}

PinConstraint.prototype.relax = function() {
    this.a.pos.mutableSet(this.pos);
}

PinConstraint.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, PinConstraintRadius, 0, 2*Math.PI);
    ctx.fillStyle = PinConstraintFillColor;
    ctx.fill();
}


// functions for the AngleConstraint
function AngleConstraint(a, b, c, stiffness) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.angle = this.b.pos.angle2(this.a.pos, this.c.pos);
    this.stiffness = stiffness;
}

AngleConstraint.prototype.relax = function(stepCoef) {
    var angle = this.b.pos.angle2(this.a.pos, this.c.pos);
    var diff = angle = this.angle;

    if(diff <= -Math.PI) {
        diff += 2*Math.PI;
    }
    else if(diff >= Math.PI) {
        diff -= 2*Math.PI;
    }

    diff *= stepCoef*this.stiffness;

    this.a.pos = this.a.pos.rotate(this.b.pos, diff);
    this.c.pos = this.c.pos.rotate(this.b.pos, -diff);
    this.b.pos = this.b.pos.rotate(this.a.pos, diff);
    this.b.pos = this.b.pos.rotate(this.c.pos, -diff);
}

AngleConstraint.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.a.pos.x, this.a.pos.y);
    ctx.lineTo(this.b.pos.x, this.b.pos.y);
    ctx.lineTo(this.c.pos.x, this.c.pos.y);
    var tmp = ctx.lineWidth;
    ctx.lineWidth = AngleConstraintLineWidth;
    ctx.strokeStyle = AngleConstraintStrokeColor;
    ctx.stroke();
    ctx.lineWidth = tmp;
}

exports.DistanceConstraint = DistanceConstraint;
exports.PinConstraint = PinConstraint;
exports.AngleConstraint = AngleConstraint;
},{}],2:[function(require,module,exports){
// exporting all the libs here just like nin node js
// cool :P

var PhyShit = require('./phyShit');
var constraint = require('./constraint');
var objects = require('./objects');

// applying to global window object
window.Vec2 = require('./vec2');
window.PhyShit = PhyShit;

window.Particle = PhyShit.Particle;

window.DistanceConstraint = constraint.DistanceConstraint
window.PinConstraint      = constraint.PinConstraint
window.AngleConstraint    = constraint.AngleConstraint
},{"./constraint":1,"./objects":3,"./phyShit":4,"./vec2":5}],3:[function(require,module,exports){
// generic PhyShit entities

var PhyShit = require('./phyShit');
var Particle = PhyShit.Particle;
var constraints = require('./constraint');
var DistanceConstraint = constraints.DistanceConstraint;

// creating point
PhyShit.prototype.point = function(pos) {
    var composite = new this.Composite();
    composite.particles.push(new Particle(pos));
    this.composites.push(composite);
    return composite;
}

// creating line segment
PhyShit.prototype.lineSegments = function(vertices, stiffness) {
    var i;
    var composite = new this.Composite();

    for(i in vertices) {
        composite.particles.push(new Particle(vertices[i]));
        if(i > 0) {
            composite.constraints.push(new DistanceConstraint(composite.particles[i], composite.particles[i-1], stiffness));
        }
    }

    this.composites.push(composite);
    return composite;
}

// creating a shapes, just change the no of segments
PhyShit.prototype.tire = function(origin, radius, segments, spokeStiffness, treadStiffness) {
    var stride = (2*Math.PI) /segments;
    var i;

    var composite = new this.Composite();

    // particles
    for(var i = 0 ; i < segments; i++) {
        var theta = i * stride;
        composite.particles.push(new Particle(new Vec2(origin.x + Math.cos(theta) * radius, origin.y + Math.sin(theta) * radius)));
    }

    var center = new Particle(origin);
    composite.particles.push(center);

    // constraints
    for(i = 0 ;i < segments; i++) {
        composite.constraints.push(new DistanceConstraint(composite.particles[i], composite.particles[(i+1)%segments], treadStiffness));
        composite.constraints.push(new DistanceConstraint(composite.particles[i], center, spokeStiffness));
        composite.constraints.push(new DistanceConstraint(composite.particles[i], composite.particles[(i+5)%segments], treadStiffness));
    }

    this.composites.push(composite);
    return composite;
}
},{"./constraint":1,"./phyShit":4}],4:[function(require,module,exports){
/*
*  author : abhishek goswami ( hiro )
*  abhishekg785@gmail.com
*
*  phyShit.js
 */

window.requestAnimationFrame = window.requestAnimationFrame
|| window.webkitRequestAnimationFrame
|| window.mozRequestAnimationFrame
|| window.oRequestAnimationFrame
|| window.msRequestAnimationFrame
|| function(callback) {
        window.setTimeout(callback, 1000 / 60);
}

// require 2d implementation of 2d vector
var Vec2 = require('./vec2');

// for exporting modules
exports = module.exports = PhyShit;
exports.Particle = Particle;
exports.Composite = Composite;

var GlobalVariables = {
    'particleRadius' : 2,
    'particleColor' : '#2dad8f',
    'highlightedParticleRadius' : 8,
}

// created a new particle
function Particle(pos) {
    this.pos = (new Vec2()).mutableSet(pos);
    this.lastPos = (new Vec2()).mutableSet(pos);
}

// draw a particle on the canvas
Particle.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, GlobalVariables.particleRadius, 0, 2*Math.PI);
    ctx.fillStyle = GlobalVariables.particleColor;
    ctx.fill();
}

// main class
function PhyShit(width, height, canvas) {
    this.width = width;
    this.height = height;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mouse = new Vec2(0,0);
    this.mouseDown = false;
    this.draggedEntity = null;
    this.selectionRadius = 20;
    this.highlightColor = "#4f545c";

    this.bounds = function(particle) {

        if(particle.pos.y > this.height - 1) {
            console.log('out of bound in y dir');
            particle.pos.y = this.height - 1;
        }

        if(particle.pos.x < 0) {
            particle.pos.x = 0;
        }

        if(particle.pos.x > this.width - 1) {
            particle.pos.x = this.width - 1;
        }

    }

    var _this = this;

    // prevents context menu
    this.canvas.oncontextmenu = function(e) {
        e.preventDefault();
    }

    this.canvas.onmousedown = function(e) {
        _this.mouseDown = true;
        var nearest = _this.nearestEntity();
        if(nearest) {
            _this.draggedEntity = nearest;
        }
    }

    this.canvas.onmouseup = function(e) {
        _this.mouseDown = false;
        _this.draggedEntity = null;
    }

    // getBoundingClientRect returns the size of an element and its
    // position relative to the viewport
    // this function sets the mouse position w.r to the canvas
    this.canvas.onmousemove = function(e) {
        var rect = _this.canvas.getBoundingClientRect();
        _this.mouse.x = e.clientX - rect.left;
        _this.mouse.y = e.clientY - rect.top;
    }

    // parameters for simulation
    this.gravity = new Vec2(0, 0.2);
    this.friction = 0.99;
    this.groundFriction = 0.8;

    // holds composite entities
    this.composites = [];   // object of the composite class

}

PhyShit.prototype.Composite = Composite;

function Composite() {
    this.particles = [];   // contains the particles to play with :P
    this.constraints = [];  // contains the constrains applied on them

    this.drawParticles = null;
    this.drawConstraints = null;
}

Composite.prototype.pin = function(index, pos) {
    pos = pos || this.particles[index].pos;
    var pc = new PinConstraint(this.particles[index], pos);
    this.constraints.push(pc);
    return pc;
}

PhyShit.prototype.frame = function(step) {
    var i, j ,c;

    for(c in this.composites) {
        for(i in this.composites[c].particles) {
            var particles = this.composites[c].particles;

            // calculate velocity
            var velocity = particles[i].pos.sub(particles[i].lastPos).scale(this.friction);

            // ground friction
            if(particles[i].pos.y >= this.height - 1 && velocity.length2() > 0.000001) {
                var m = velocity.length();
                velocity.x /= m;
                velocity.y /= m;
                velocity.mutableScale(m * this.groundFriction);
            }

            // save last good state
            particles[i].lastPos.mutableSet(particles[i].pos);

            // adding gravity
            particles[i].pos.mutableAdd(this.gravity);

            // adding inertia
            particles[i].pos.mutableAdd(velocity);
        }
    }

    // handle dragging of entities
    if(this.draggedEntity) {
        console.log('dragging to the mouse' + this.mouse);
        this.draggedEntity.pos.mutableSet(this.mouse);
    }

    //relax
    var stepCoef = 1 / step;
    for(c in this.composites) {
        var constraints = this.composites[c].constraints;
        for(var i = 0 ; i < step; i++) {
            for( j in constraints) {
                constraints[j].relax(stepCoef);
            }
        }
    }

    // bound checking
    for(c in this.composites) {
        var particles = this.composites[c].particles;
        for(i in particles) {
            this.bounds(particles[i]);
        }
    }
}

PhyShit.prototype.draw = function() {
    console.log('drawing');
    var i,c;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for(c in this.composites) {
        // draw constraints
        if(this.composites[c].drawConstraints) {
            this.composites[c].drawConstraints(this.ctx, this.composites[c]);
        }
        else{
            var constraints = this.composites[c].constraints;
            for(i in constraints) {
                constraints[i].draw(this.ctx);
            }
        }
    }

    // draw particles
    if(this.composites[c].drawParticles) {
        this.composites[c].drawParticles(this.ctx, this.composites[c]);
    }
    else{
        var particles = this.composites[c].particles;
        for(i in particles) {
            particles[i].draw(this.ctx);
        }
    }

    // highlight nearest / dragged entity
    var nearest = this.draggedEntity || this.nearestEntity();
    if(nearest) {
        this.ctx.beginPath();
        this.ctx.arc(nearest.pos.x, nearest.pos.y, GlobalVariables.highlightedParticleRadius, 0, 2 * Math.PI);
        this.ctx.strokeStyle = this.highlightColor;
        this.ctx.stroke();
    }
}

PhyShit.prototype.nearestEntity = function() {
    var c, i;
    var d2Nearest = 0;
    var entity = null;
    var constraintNearest = null;

    // find nearest point
    for(c in this.composites) {
        var particles = this.composites[c].particles;
        for(i in particles) {
            var d2 = particles[i].pos.dist2(this.mouse);
            if(d2 <= this.selectionRadius * this.selectionRadius && (entity == null || d2 < d2Nearest)) {
                entity = particles[i];
                constraintNearest = this.composites[c].constraints;
                d2Nearest = d2;
            }
        }
    }

    // search for pinned constraint for this entity
    for(i in constraintNearest) {
        if(constraintNearest[i] instanceof PinConstraint && constraintNearest[i].a == entity) {
            entity = constraintNearest[i];
        }
    }

    return entity;
}

},{"./vec2":5}],5:[function(require,module,exports){
/*
*  author : abhishek goswami ( hiro )
*  abhishekg785@gmail.com
*
*   vec2.js : a simple 2-D vector implementation
*/

function Vec2(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vec2.prototype.add = function(v) {
    return new Vec2(this.x + v.x, this.y + v.y);
}

Vec2.prototype.sub = function(v) {
    return new Vec2(this.x - v.x, this.y - v.y);
}

Vec2.prototype.mul = function(v) {
    return new Vec2(this.x * v.x, this.y * v.y);
}

Vec2.prototype.div = function(v) {
    return new Vec2(this.x / v.x, this.y / v.y)
}

Vec2.prototype.scale = function(factor) {
    return new Vec2(this.x * factor, this.y * factor);
}

Vec2.prototype.mutableSet = function(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
}

Vec2.prototype.mutableAdd = function(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
}

Vec2.prototype.mutableSub = function(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
}

Vec2.prototype.mutableMul = function(v) {
    this.x *= v.x;
    this.y *= v.y;
    return this;
}

Vec2.prototype.mutableDiv = function(v) {
    this.x /= v.x;
    this.y /= v.y;
    return this;
}

Vec2.prototype.mutableScale = function(factor) {
    this.x *= factor;
    this.y *= factor;
    return this;
}

Vec2.prototype.equals = function(v) {
    return this.x == v.x && this.y == v.y;
}

Vec2.prototype.epsilonEquals = function(v, epsilon) {
    return Math.abs(this.x - v.x) <= epsilon && Math.abs(this.y - v.y) <= epsilon;
}

// less efficient since the use of the Math.sqrt function
Vec2.prototype.length = function(v) {
    return Math.sqrt(this.x * this.x + this.y * this.y);
}

// more efficient than the above
Vec2.prototype.length2 = function(v) {
    return this.x * this.x + this.y * this.y;
}

Vec2.prototype.dist = function(v) {
    return Math.sqrt(this.dist2(v));
}

Vec2.prototype.dist2 = function(v) {
    var x = v.x - this.x;
    var y = v.y - this.y;
    return x*x + y*y;
}

Vec2.prototype.normal = function() {
    var m = Math.sqrt(this.x * this.x + this.y * this.y);
    return new Vec2(this.x/m, this.y/m);
}

Vec2.prototype.dot = function(v) {
    return this.x * v.x + this.y * v.y;
}

Vec2.prototype.angle = function(v) {
    return Math.atan2(this.x * v.y - this.y * v.x, this.x * v.x + this.y * v.y);
}

Vec2.prototype.angle2 = function(vLeft, vRight) {
    return vLeft.sub(this).angle(vRight.sub(this));
}

/*
    rotation of a vector through an angle theta and shift in the origin
    x = r cos(initial_angle)
    y = r sin(initial_angle)
    now rotation through and angle of theta
    x' = r cos(initial_angle + theta)
    y' = r cos(initial_angle + theta)
    so => x' = x cos(theta) - y sin(theta)
          y' = y cos(theta) + x sin(theta)
 */
Vec2.prototype.rotate = function(origin, theta) {
    var x = this.x - origin.x;
    var y = this.y - origin.y;
    return new Vec2(x * Math.cos(theta) - y * Math.sin(theta) + origin.x, x * Math.sin(theta) + y * Math.cos(theta) + origin.y );
}


Vec2.prototype.toString = function() {
    return "(" + this.x + ", " + this.y + ")";
}

module.exports = Vec2;
},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY29uc3RyYWludC5qcyIsImxpYi9pbnRlZy5qcyIsImxpYi9vYmplY3RzLmpzIiwibGliL3BoeVNoaXQuanMiLCJsaWIvdmVjMi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypcbiogIGF1dGhvciA6IGFiaGlzaGVrIGdvc3dhbWkgKCBIaXJvIClcbiogIGFiaGlzaGVrZzc4NUBnbWFpbC5jb21cbipcbiogIGNvbnN0cmFpbnQuanMgOiBhZGRpbmcgdGhlIGNvbnN0cmFpbnQgb24gdGhlIHBhcnRpY2xlc1xuICovXG5cbi8vIERpc3RhbmNlQ29uc3RyYWludCAtLSBjb25zdHJhaW50cyB0byB0aGUgaW5pdGlhbCBkaXN0YW5jZVxuLy8gUGluQ29uc3RyYWludCAtLSBjb25zdHJhaW5zIHRvIHN0YXRpYy9maXhlZCBwb2ludHNcbi8vIEFuZ2xlQ29uc3RyYWludHMgLS0gY29udGFpbnMgMyBwYXJ0aWNsZXMgdG8gYW4gYW5nbGVcblxudmFyIGxpbmVTdHJva2VDb2xvciA9ICdkOGRkZTInLFxuICAgIFBpbkNvbnN0cmFpbnRSYWRpdXMgPSA2LFxuICAgIFBpbkNvbnN0cmFpbnRGaWxsQ29sb3IgPSAncmdiYSgwLDE1MywyNTUsMC4xKScsXG5cbiAgICBBbmdsZUNvbnN0cmFpbnRTdHJva2VDb2xvciA9ICdyZ2JhKDI1NSwyNTUsMCwwLjIpJyxcbiAgICBBbmdsZUNvbnN0cmFpbnRMaW5lV2lkdGggPSA1O1xuXG5cbi8vIGNsYXNzIERpc3RhbmNlQ29uc3RyYWludCBhcyBhIGNvbnN0cnVjdG9yXG5mdW5jdGlvbiBEaXN0YW5jZUNvbnN0cmFpbnQoYSwgYiwgc3RpZmZuZXNzLCBkaXN0YW5jZSkge1xuICAgIHRoaXMuYSA9IGE7XG4gICAgdGhpcy5iID0gYjtcbiAgICB0aGlzLmRpc3RhbmNlID0gdHlwZW9mIGRpc3RhbmNlICE9IFwidW5kZWZpbmVkXCIgPyBkaXN0YW5jZSA6IGEucG9zLnN1YihiLnBvcykubGVuZ3RoKCk7XG4gICAgdGhpcy5zdGlmZm5lc3MgPSBzdGlmZm5lc3M7XG59XG5cbkRpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUucmVsYXggPSBmdW5jdGlvbihzdGVwQ29lZikge1xuICAgIHZhciBub3JtYWwgPSB0aGlzLmEucG9zLnN1Yih0aGlzLmIucG9zKTtcbiAgICB2YXIgbSA9IG5vcm1hbC5sZW5ndGgyKCk7XG4gICAgbm9ybWFsLm11dGFibGVTY2FsZSgoKHRoaXMuZGlzdGFuY2UqdGhpcy5kaXN0YW5jZSAtIG0pL20pKnRoaXMuc3RpZmZuZXNzKnN0ZXBDb2VmKTtcbiAgICB0aGlzLmEucG9zLm11dGFibGVBZGQobm9ybWFsKTtcbiAgICB0aGlzLmIucG9zLm11dGFibGVTdWIobm9ybWFsKTtcbn1cblxuRGlzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY3R4KSB7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5tb3ZlVG8odGhpcy5hLnBvcy54LCB0aGlzLmEucG9zLnkpO1xuICAgIGN0eC5saW5lVG8odGhpcy5iLnBvcy54LCB0aGlzLmIucG9zLnkpO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IGxpbmVTdHJva2VDb2xvcjtcbiAgICBjdHguc3Ryb2tlKCk7XG59XG5cblxuLy8gZnVuY3Rpb25zIGZvciBwaW4gY29uc3RyYWludCBzdGFydHMgaGVyZVxuXG4vLyBQaW5Db25zdHJhaW50cyBjb25zIGhhdmluZyBwYXJhbXM6XG4vLyBhIDogdGhlIHBvaW50IHRvIHdvcmsgb25cbi8vIHBvcyA6IHBvc2l0aW9uIHdoZXJlIHRvIHNldCB0aGUgcG9pbnQgb24gdGhlIGNhbnZhc1xuZnVuY3Rpb24gUGluQ29uc3RyYWludChhLCBwb3MpIHtcbiAgICB0aGlzLmEgPSBhO1xuICAgIHRoaXMucG9zID0gKG5ldyBWZWMyKCkpLm11dGFibGVTZXQocG9zKTtcbn1cblxuUGluQ29uc3RyYWludC5wcm90b3R5cGUucmVsYXggPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmEucG9zLm11dGFibGVTZXQodGhpcy5wb3MpO1xufVxuXG5QaW5Db25zdHJhaW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY3R4KSB7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5hcmModGhpcy5wb3MueCwgdGhpcy5wb3MueSwgUGluQ29uc3RyYWludFJhZGl1cywgMCwgMipNYXRoLlBJKTtcbiAgICBjdHguZmlsbFN0eWxlID0gUGluQ29uc3RyYWludEZpbGxDb2xvcjtcbiAgICBjdHguZmlsbCgpO1xufVxuXG5cbi8vIGZ1bmN0aW9ucyBmb3IgdGhlIEFuZ2xlQ29uc3RyYWludFxuZnVuY3Rpb24gQW5nbGVDb25zdHJhaW50KGEsIGIsIGMsIHN0aWZmbmVzcykge1xuICAgIHRoaXMuYSA9IGE7XG4gICAgdGhpcy5iID0gYjtcbiAgICB0aGlzLmMgPSBjO1xuICAgIHRoaXMuYW5nbGUgPSB0aGlzLmIucG9zLmFuZ2xlMih0aGlzLmEucG9zLCB0aGlzLmMucG9zKTtcbiAgICB0aGlzLnN0aWZmbmVzcyA9IHN0aWZmbmVzcztcbn1cblxuQW5nbGVDb25zdHJhaW50LnByb3RvdHlwZS5yZWxheCA9IGZ1bmN0aW9uKHN0ZXBDb2VmKSB7XG4gICAgdmFyIGFuZ2xlID0gdGhpcy5iLnBvcy5hbmdsZTIodGhpcy5hLnBvcywgdGhpcy5jLnBvcyk7XG4gICAgdmFyIGRpZmYgPSBhbmdsZSA9IHRoaXMuYW5nbGU7XG5cbiAgICBpZihkaWZmIDw9IC1NYXRoLlBJKSB7XG4gICAgICAgIGRpZmYgKz0gMipNYXRoLlBJO1xuICAgIH1cbiAgICBlbHNlIGlmKGRpZmYgPj0gTWF0aC5QSSkge1xuICAgICAgICBkaWZmIC09IDIqTWF0aC5QSTtcbiAgICB9XG5cbiAgICBkaWZmICo9IHN0ZXBDb2VmKnRoaXMuc3RpZmZuZXNzO1xuXG4gICAgdGhpcy5hLnBvcyA9IHRoaXMuYS5wb3Mucm90YXRlKHRoaXMuYi5wb3MsIGRpZmYpO1xuICAgIHRoaXMuYy5wb3MgPSB0aGlzLmMucG9zLnJvdGF0ZSh0aGlzLmIucG9zLCAtZGlmZik7XG4gICAgdGhpcy5iLnBvcyA9IHRoaXMuYi5wb3Mucm90YXRlKHRoaXMuYS5wb3MsIGRpZmYpO1xuICAgIHRoaXMuYi5wb3MgPSB0aGlzLmIucG9zLnJvdGF0ZSh0aGlzLmMucG9zLCAtZGlmZik7XG59XG5cbkFuZ2xlQ29uc3RyYWludC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGN0eCkge1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgubW92ZVRvKHRoaXMuYS5wb3MueCwgdGhpcy5hLnBvcy55KTtcbiAgICBjdHgubGluZVRvKHRoaXMuYi5wb3MueCwgdGhpcy5iLnBvcy55KTtcbiAgICBjdHgubGluZVRvKHRoaXMuYy5wb3MueCwgdGhpcy5jLnBvcy55KTtcbiAgICB2YXIgdG1wID0gY3R4LmxpbmVXaWR0aDtcbiAgICBjdHgubGluZVdpZHRoID0gQW5nbGVDb25zdHJhaW50TGluZVdpZHRoO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IEFuZ2xlQ29uc3RyYWludFN0cm9rZUNvbG9yO1xuICAgIGN0eC5zdHJva2UoKTtcbiAgICBjdHgubGluZVdpZHRoID0gdG1wO1xufVxuXG5leHBvcnRzLkRpc3RhbmNlQ29uc3RyYWludCA9IERpc3RhbmNlQ29uc3RyYWludDtcbmV4cG9ydHMuUGluQ29uc3RyYWludCA9IFBpbkNvbnN0cmFpbnQ7XG5leHBvcnRzLkFuZ2xlQ29uc3RyYWludCA9IEFuZ2xlQ29uc3RyYWludDsiLCIvLyBleHBvcnRpbmcgYWxsIHRoZSBsaWJzIGhlcmUganVzdCBsaWtlIG5pbiBub2RlIGpzXG4vLyBjb29sIDpQXG5cbnZhciBQaHlTaGl0ID0gcmVxdWlyZSgnLi9waHlTaGl0Jyk7XG52YXIgY29uc3RyYWludCA9IHJlcXVpcmUoJy4vY29uc3RyYWludCcpO1xudmFyIG9iamVjdHMgPSByZXF1aXJlKCcuL29iamVjdHMnKTtcblxuLy8gYXBwbHlpbmcgdG8gZ2xvYmFsIHdpbmRvdyBvYmplY3RcbndpbmRvdy5WZWMyID0gcmVxdWlyZSgnLi92ZWMyJyk7XG53aW5kb3cuUGh5U2hpdCA9IFBoeVNoaXQ7XG5cbndpbmRvdy5QYXJ0aWNsZSA9IFBoeVNoaXQuUGFydGljbGU7XG5cbndpbmRvdy5EaXN0YW5jZUNvbnN0cmFpbnQgPSBjb25zdHJhaW50LkRpc3RhbmNlQ29uc3RyYWludFxud2luZG93LlBpbkNvbnN0cmFpbnQgICAgICA9IGNvbnN0cmFpbnQuUGluQ29uc3RyYWludFxud2luZG93LkFuZ2xlQ29uc3RyYWludCAgICA9IGNvbnN0cmFpbnQuQW5nbGVDb25zdHJhaW50IiwiLy8gZ2VuZXJpYyBQaHlTaGl0IGVudGl0aWVzXG5cbnZhciBQaHlTaGl0ID0gcmVxdWlyZSgnLi9waHlTaGl0Jyk7XG52YXIgUGFydGljbGUgPSBQaHlTaGl0LlBhcnRpY2xlO1xudmFyIGNvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi9jb25zdHJhaW50Jyk7XG52YXIgRGlzdGFuY2VDb25zdHJhaW50ID0gY29uc3RyYWludHMuRGlzdGFuY2VDb25zdHJhaW50O1xuXG4vLyBjcmVhdGluZyBwb2ludFxuUGh5U2hpdC5wcm90b3R5cGUucG9pbnQgPSBmdW5jdGlvbihwb3MpIHtcbiAgICB2YXIgY29tcG9zaXRlID0gbmV3IHRoaXMuQ29tcG9zaXRlKCk7XG4gICAgY29tcG9zaXRlLnBhcnRpY2xlcy5wdXNoKG5ldyBQYXJ0aWNsZShwb3MpKTtcbiAgICB0aGlzLmNvbXBvc2l0ZXMucHVzaChjb21wb3NpdGUpO1xuICAgIHJldHVybiBjb21wb3NpdGU7XG59XG5cbi8vIGNyZWF0aW5nIGxpbmUgc2VnbWVudFxuUGh5U2hpdC5wcm90b3R5cGUubGluZVNlZ21lbnRzID0gZnVuY3Rpb24odmVydGljZXMsIHN0aWZmbmVzcykge1xuICAgIHZhciBpO1xuICAgIHZhciBjb21wb3NpdGUgPSBuZXcgdGhpcy5Db21wb3NpdGUoKTtcblxuICAgIGZvcihpIGluIHZlcnRpY2VzKSB7XG4gICAgICAgIGNvbXBvc2l0ZS5wYXJ0aWNsZXMucHVzaChuZXcgUGFydGljbGUodmVydGljZXNbaV0pKTtcbiAgICAgICAgaWYoaSA+IDApIHtcbiAgICAgICAgICAgIGNvbXBvc2l0ZS5jb25zdHJhaW50cy5wdXNoKG5ldyBEaXN0YW5jZUNvbnN0cmFpbnQoY29tcG9zaXRlLnBhcnRpY2xlc1tpXSwgY29tcG9zaXRlLnBhcnRpY2xlc1tpLTFdLCBzdGlmZm5lc3MpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29tcG9zaXRlcy5wdXNoKGNvbXBvc2l0ZSk7XG4gICAgcmV0dXJuIGNvbXBvc2l0ZTtcbn1cblxuLy8gY3JlYXRpbmcgYSBzaGFwZXMsIGp1c3QgY2hhbmdlIHRoZSBubyBvZiBzZWdtZW50c1xuUGh5U2hpdC5wcm90b3R5cGUudGlyZSA9IGZ1bmN0aW9uKG9yaWdpbiwgcmFkaXVzLCBzZWdtZW50cywgc3Bva2VTdGlmZm5lc3MsIHRyZWFkU3RpZmZuZXNzKSB7XG4gICAgdmFyIHN0cmlkZSA9ICgyKk1hdGguUEkpIC9zZWdtZW50cztcbiAgICB2YXIgaTtcblxuICAgIHZhciBjb21wb3NpdGUgPSBuZXcgdGhpcy5Db21wb3NpdGUoKTtcblxuICAgIC8vIHBhcnRpY2xlc1xuICAgIGZvcih2YXIgaSA9IDAgOyBpIDwgc2VnbWVudHM7IGkrKykge1xuICAgICAgICB2YXIgdGhldGEgPSBpICogc3RyaWRlO1xuICAgICAgICBjb21wb3NpdGUucGFydGljbGVzLnB1c2gobmV3IFBhcnRpY2xlKG5ldyBWZWMyKG9yaWdpbi54ICsgTWF0aC5jb3ModGhldGEpICogcmFkaXVzLCBvcmlnaW4ueSArIE1hdGguc2luKHRoZXRhKSAqIHJhZGl1cykpKTtcbiAgICB9XG5cbiAgICB2YXIgY2VudGVyID0gbmV3IFBhcnRpY2xlKG9yaWdpbik7XG4gICAgY29tcG9zaXRlLnBhcnRpY2xlcy5wdXNoKGNlbnRlcik7XG5cbiAgICAvLyBjb25zdHJhaW50c1xuICAgIGZvcihpID0gMCA7aSA8IHNlZ21lbnRzOyBpKyspIHtcbiAgICAgICAgY29tcG9zaXRlLmNvbnN0cmFpbnRzLnB1c2gobmV3IERpc3RhbmNlQ29uc3RyYWludChjb21wb3NpdGUucGFydGljbGVzW2ldLCBjb21wb3NpdGUucGFydGljbGVzWyhpKzEpJXNlZ21lbnRzXSwgdHJlYWRTdGlmZm5lc3MpKTtcbiAgICAgICAgY29tcG9zaXRlLmNvbnN0cmFpbnRzLnB1c2gobmV3IERpc3RhbmNlQ29uc3RyYWludChjb21wb3NpdGUucGFydGljbGVzW2ldLCBjZW50ZXIsIHNwb2tlU3RpZmZuZXNzKSk7XG4gICAgICAgIGNvbXBvc2l0ZS5jb25zdHJhaW50cy5wdXNoKG5ldyBEaXN0YW5jZUNvbnN0cmFpbnQoY29tcG9zaXRlLnBhcnRpY2xlc1tpXSwgY29tcG9zaXRlLnBhcnRpY2xlc1soaSs1KSVzZWdtZW50c10sIHRyZWFkU3RpZmZuZXNzKSk7XG4gICAgfVxuXG4gICAgdGhpcy5jb21wb3NpdGVzLnB1c2goY29tcG9zaXRlKTtcbiAgICByZXR1cm4gY29tcG9zaXRlO1xufSIsIi8qXG4qICBhdXRob3IgOiBhYmhpc2hlayBnb3N3YW1pICggaGlybyApXG4qICBhYmhpc2hla2c3ODVAZ21haWwuY29tXG4qXG4qICBwaHlTaGl0LmpzXG4gKi9cblxud2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbnx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbnx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbnx8IHdpbmRvdy5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lXG58fCB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbnx8IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xufVxuXG4vLyByZXF1aXJlIDJkIGltcGxlbWVudGF0aW9uIG9mIDJkIHZlY3RvclxudmFyIFZlYzIgPSByZXF1aXJlKCcuL3ZlYzInKTtcblxuLy8gZm9yIGV4cG9ydGluZyBtb2R1bGVzXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBQaHlTaGl0O1xuZXhwb3J0cy5QYXJ0aWNsZSA9IFBhcnRpY2xlO1xuZXhwb3J0cy5Db21wb3NpdGUgPSBDb21wb3NpdGU7XG5cbnZhciBHbG9iYWxWYXJpYWJsZXMgPSB7XG4gICAgJ3BhcnRpY2xlUmFkaXVzJyA6IDIsXG4gICAgJ3BhcnRpY2xlQ29sb3InIDogJyMyZGFkOGYnLFxuICAgICdoaWdobGlnaHRlZFBhcnRpY2xlUmFkaXVzJyA6IDgsXG59XG5cbi8vIGNyZWF0ZWQgYSBuZXcgcGFydGljbGVcbmZ1bmN0aW9uIFBhcnRpY2xlKHBvcykge1xuICAgIHRoaXMucG9zID0gKG5ldyBWZWMyKCkpLm11dGFibGVTZXQocG9zKTtcbiAgICB0aGlzLmxhc3RQb3MgPSAobmV3IFZlYzIoKSkubXV0YWJsZVNldChwb3MpO1xufVxuXG4vLyBkcmF3IGEgcGFydGljbGUgb24gdGhlIGNhbnZhc1xuUGFydGljbGUucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjdHgpIHtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4LmFyYyh0aGlzLnBvcy54LCB0aGlzLnBvcy55LCBHbG9iYWxWYXJpYWJsZXMucGFydGljbGVSYWRpdXMsIDAsIDIqTWF0aC5QSSk7XG4gICAgY3R4LmZpbGxTdHlsZSA9IEdsb2JhbFZhcmlhYmxlcy5wYXJ0aWNsZUNvbG9yO1xuICAgIGN0eC5maWxsKCk7XG59XG5cbi8vIG1haW4gY2xhc3NcbmZ1bmN0aW9uIFBoeVNoaXQod2lkdGgsIGhlaWdodCwgY2FudmFzKSB7XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xuICAgIHRoaXMuY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5tb3VzZSA9IG5ldyBWZWMyKDAsMCk7XG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLmRyYWdnZWRFbnRpdHkgPSBudWxsO1xuICAgIHRoaXMuc2VsZWN0aW9uUmFkaXVzID0gMjA7XG4gICAgdGhpcy5oaWdobGlnaHRDb2xvciA9IFwiIzRmNTQ1Y1wiO1xuXG4gICAgdGhpcy5ib3VuZHMgPSBmdW5jdGlvbihwYXJ0aWNsZSkge1xuXG4gICAgICAgIGlmKHBhcnRpY2xlLnBvcy55ID4gdGhpcy5oZWlnaHQgLSAxKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnb3V0IG9mIGJvdW5kIGluIHkgZGlyJyk7XG4gICAgICAgICAgICBwYXJ0aWNsZS5wb3MueSA9IHRoaXMuaGVpZ2h0IC0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHBhcnRpY2xlLnBvcy54IDwgMCkge1xuICAgICAgICAgICAgcGFydGljbGUucG9zLnggPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYocGFydGljbGUucG9zLnggPiB0aGlzLndpZHRoIC0gMSkge1xuICAgICAgICAgICAgcGFydGljbGUucG9zLnggPSB0aGlzLndpZHRoIC0gMTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIHByZXZlbnRzIGNvbnRleHQgbWVudVxuICAgIHRoaXMuY2FudmFzLm9uY29udGV4dG1lbnUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICB0aGlzLmNhbnZhcy5vbm1vdXNlZG93biA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgX3RoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgdmFyIG5lYXJlc3QgPSBfdGhpcy5uZWFyZXN0RW50aXR5KCk7XG4gICAgICAgIGlmKG5lYXJlc3QpIHtcbiAgICAgICAgICAgIF90aGlzLmRyYWdnZWRFbnRpdHkgPSBuZWFyZXN0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jYW52YXMub25tb3VzZXVwID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBfdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgX3RoaXMuZHJhZ2dlZEVudGl0eSA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gZ2V0Qm91bmRpbmdDbGllbnRSZWN0IHJldHVybnMgdGhlIHNpemUgb2YgYW4gZWxlbWVudCBhbmQgaXRzXG4gICAgLy8gcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0XG4gICAgLy8gdGhpcyBmdW5jdGlvbiBzZXRzIHRoZSBtb3VzZSBwb3NpdGlvbiB3LnIgdG8gdGhlIGNhbnZhc1xuICAgIHRoaXMuY2FudmFzLm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgcmVjdCA9IF90aGlzLmNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgX3RoaXMubW91c2UueCA9IGUuY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICAgICAgX3RoaXMubW91c2UueSA9IGUuY2xpZW50WSAtIHJlY3QudG9wO1xuICAgIH1cblxuICAgIC8vIHBhcmFtZXRlcnMgZm9yIHNpbXVsYXRpb25cbiAgICB0aGlzLmdyYXZpdHkgPSBuZXcgVmVjMigwLCAwLjIpO1xuICAgIHRoaXMuZnJpY3Rpb24gPSAwLjk5O1xuICAgIHRoaXMuZ3JvdW5kRnJpY3Rpb24gPSAwLjg7XG5cbiAgICAvLyBob2xkcyBjb21wb3NpdGUgZW50aXRpZXNcbiAgICB0aGlzLmNvbXBvc2l0ZXMgPSBbXTsgICAvLyBvYmplY3Qgb2YgdGhlIGNvbXBvc2l0ZSBjbGFzc1xuXG59XG5cblBoeVNoaXQucHJvdG90eXBlLkNvbXBvc2l0ZSA9IENvbXBvc2l0ZTtcblxuZnVuY3Rpb24gQ29tcG9zaXRlKCkge1xuICAgIHRoaXMucGFydGljbGVzID0gW107ICAgLy8gY29udGFpbnMgdGhlIHBhcnRpY2xlcyB0byBwbGF5IHdpdGggOlBcbiAgICB0aGlzLmNvbnN0cmFpbnRzID0gW107ICAvLyBjb250YWlucyB0aGUgY29uc3RyYWlucyBhcHBsaWVkIG9uIHRoZW1cblxuICAgIHRoaXMuZHJhd1BhcnRpY2xlcyA9IG51bGw7XG4gICAgdGhpcy5kcmF3Q29uc3RyYWludHMgPSBudWxsO1xufVxuXG5Db21wb3NpdGUucHJvdG90eXBlLnBpbiA9IGZ1bmN0aW9uKGluZGV4LCBwb3MpIHtcbiAgICBwb3MgPSBwb3MgfHwgdGhpcy5wYXJ0aWNsZXNbaW5kZXhdLnBvcztcbiAgICB2YXIgcGMgPSBuZXcgUGluQ29uc3RyYWludCh0aGlzLnBhcnRpY2xlc1tpbmRleF0sIHBvcyk7XG4gICAgdGhpcy5jb25zdHJhaW50cy5wdXNoKHBjKTtcbiAgICByZXR1cm4gcGM7XG59XG5cblBoeVNoaXQucHJvdG90eXBlLmZyYW1lID0gZnVuY3Rpb24oc3RlcCkge1xuICAgIHZhciBpLCBqICxjO1xuXG4gICAgZm9yKGMgaW4gdGhpcy5jb21wb3NpdGVzKSB7XG4gICAgICAgIGZvcihpIGluIHRoaXMuY29tcG9zaXRlc1tjXS5wYXJ0aWNsZXMpIHtcbiAgICAgICAgICAgIHZhciBwYXJ0aWNsZXMgPSB0aGlzLmNvbXBvc2l0ZXNbY10ucGFydGljbGVzO1xuXG4gICAgICAgICAgICAvLyBjYWxjdWxhdGUgdmVsb2NpdHlcbiAgICAgICAgICAgIHZhciB2ZWxvY2l0eSA9IHBhcnRpY2xlc1tpXS5wb3Muc3ViKHBhcnRpY2xlc1tpXS5sYXN0UG9zKS5zY2FsZSh0aGlzLmZyaWN0aW9uKTtcblxuICAgICAgICAgICAgLy8gZ3JvdW5kIGZyaWN0aW9uXG4gICAgICAgICAgICBpZihwYXJ0aWNsZXNbaV0ucG9zLnkgPj0gdGhpcy5oZWlnaHQgLSAxICYmIHZlbG9jaXR5Lmxlbmd0aDIoKSA+IDAuMDAwMDAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIG0gPSB2ZWxvY2l0eS5sZW5ndGgoKTtcbiAgICAgICAgICAgICAgICB2ZWxvY2l0eS54IC89IG07XG4gICAgICAgICAgICAgICAgdmVsb2NpdHkueSAvPSBtO1xuICAgICAgICAgICAgICAgIHZlbG9jaXR5Lm11dGFibGVTY2FsZShtICogdGhpcy5ncm91bmRGcmljdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNhdmUgbGFzdCBnb29kIHN0YXRlXG4gICAgICAgICAgICBwYXJ0aWNsZXNbaV0ubGFzdFBvcy5tdXRhYmxlU2V0KHBhcnRpY2xlc1tpXS5wb3MpO1xuXG4gICAgICAgICAgICAvLyBhZGRpbmcgZ3Jhdml0eVxuICAgICAgICAgICAgcGFydGljbGVzW2ldLnBvcy5tdXRhYmxlQWRkKHRoaXMuZ3Jhdml0eSk7XG5cbiAgICAgICAgICAgIC8vIGFkZGluZyBpbmVydGlhXG4gICAgICAgICAgICBwYXJ0aWNsZXNbaV0ucG9zLm11dGFibGVBZGQodmVsb2NpdHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gaGFuZGxlIGRyYWdnaW5nIG9mIGVudGl0aWVzXG4gICAgaWYodGhpcy5kcmFnZ2VkRW50aXR5KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdkcmFnZ2luZyB0byB0aGUgbW91c2UnICsgdGhpcy5tb3VzZSk7XG4gICAgICAgIHRoaXMuZHJhZ2dlZEVudGl0eS5wb3MubXV0YWJsZVNldCh0aGlzLm1vdXNlKTtcbiAgICB9XG5cbiAgICAvL3JlbGF4XG4gICAgdmFyIHN0ZXBDb2VmID0gMSAvIHN0ZXA7XG4gICAgZm9yKGMgaW4gdGhpcy5jb21wb3NpdGVzKSB7XG4gICAgICAgIHZhciBjb25zdHJhaW50cyA9IHRoaXMuY29tcG9zaXRlc1tjXS5jb25zdHJhaW50cztcbiAgICAgICAgZm9yKHZhciBpID0gMCA7IGkgPCBzdGVwOyBpKyspIHtcbiAgICAgICAgICAgIGZvciggaiBpbiBjb25zdHJhaW50cykge1xuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzW2pdLnJlbGF4KHN0ZXBDb2VmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGJvdW5kIGNoZWNraW5nXG4gICAgZm9yKGMgaW4gdGhpcy5jb21wb3NpdGVzKSB7XG4gICAgICAgIHZhciBwYXJ0aWNsZXMgPSB0aGlzLmNvbXBvc2l0ZXNbY10ucGFydGljbGVzO1xuICAgICAgICBmb3IoaSBpbiBwYXJ0aWNsZXMpIHtcbiAgICAgICAgICAgIHRoaXMuYm91bmRzKHBhcnRpY2xlc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cblBoeVNoaXQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnZHJhd2luZycpO1xuICAgIHZhciBpLGM7XG5cbiAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG5cbiAgICBmb3IoYyBpbiB0aGlzLmNvbXBvc2l0ZXMpIHtcbiAgICAgICAgLy8gZHJhdyBjb25zdHJhaW50c1xuICAgICAgICBpZih0aGlzLmNvbXBvc2l0ZXNbY10uZHJhd0NvbnN0cmFpbnRzKSB7XG4gICAgICAgICAgICB0aGlzLmNvbXBvc2l0ZXNbY10uZHJhd0NvbnN0cmFpbnRzKHRoaXMuY3R4LCB0aGlzLmNvbXBvc2l0ZXNbY10pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgICB2YXIgY29uc3RyYWludHMgPSB0aGlzLmNvbXBvc2l0ZXNbY10uY29uc3RyYWludHM7XG4gICAgICAgICAgICBmb3IoaSBpbiBjb25zdHJhaW50cykge1xuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzW2ldLmRyYXcodGhpcy5jdHgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gZHJhdyBwYXJ0aWNsZXNcbiAgICBpZih0aGlzLmNvbXBvc2l0ZXNbY10uZHJhd1BhcnRpY2xlcykge1xuICAgICAgICB0aGlzLmNvbXBvc2l0ZXNbY10uZHJhd1BhcnRpY2xlcyh0aGlzLmN0eCwgdGhpcy5jb21wb3NpdGVzW2NdKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgdmFyIHBhcnRpY2xlcyA9IHRoaXMuY29tcG9zaXRlc1tjXS5wYXJ0aWNsZXM7XG4gICAgICAgIGZvcihpIGluIHBhcnRpY2xlcykge1xuICAgICAgICAgICAgcGFydGljbGVzW2ldLmRyYXcodGhpcy5jdHgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gaGlnaGxpZ2h0IG5lYXJlc3QgLyBkcmFnZ2VkIGVudGl0eVxuICAgIHZhciBuZWFyZXN0ID0gdGhpcy5kcmFnZ2VkRW50aXR5IHx8IHRoaXMubmVhcmVzdEVudGl0eSgpO1xuICAgIGlmKG5lYXJlc3QpIHtcbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4LmFyYyhuZWFyZXN0LnBvcy54LCBuZWFyZXN0LnBvcy55LCBHbG9iYWxWYXJpYWJsZXMuaGlnaGxpZ2h0ZWRQYXJ0aWNsZVJhZGl1cywgMCwgMiAqIE1hdGguUEkpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IHRoaXMuaGlnaGxpZ2h0Q29sb3I7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgIH1cbn1cblxuUGh5U2hpdC5wcm90b3R5cGUubmVhcmVzdEVudGl0eSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjLCBpO1xuICAgIHZhciBkMk5lYXJlc3QgPSAwO1xuICAgIHZhciBlbnRpdHkgPSBudWxsO1xuICAgIHZhciBjb25zdHJhaW50TmVhcmVzdCA9IG51bGw7XG5cbiAgICAvLyBmaW5kIG5lYXJlc3QgcG9pbnRcbiAgICBmb3IoYyBpbiB0aGlzLmNvbXBvc2l0ZXMpIHtcbiAgICAgICAgdmFyIHBhcnRpY2xlcyA9IHRoaXMuY29tcG9zaXRlc1tjXS5wYXJ0aWNsZXM7XG4gICAgICAgIGZvcihpIGluIHBhcnRpY2xlcykge1xuICAgICAgICAgICAgdmFyIGQyID0gcGFydGljbGVzW2ldLnBvcy5kaXN0Mih0aGlzLm1vdXNlKTtcbiAgICAgICAgICAgIGlmKGQyIDw9IHRoaXMuc2VsZWN0aW9uUmFkaXVzICogdGhpcy5zZWxlY3Rpb25SYWRpdXMgJiYgKGVudGl0eSA9PSBudWxsIHx8IGQyIDwgZDJOZWFyZXN0KSkge1xuICAgICAgICAgICAgICAgIGVudGl0eSA9IHBhcnRpY2xlc1tpXTtcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50TmVhcmVzdCA9IHRoaXMuY29tcG9zaXRlc1tjXS5jb25zdHJhaW50cztcbiAgICAgICAgICAgICAgICBkMk5lYXJlc3QgPSBkMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNlYXJjaCBmb3IgcGlubmVkIGNvbnN0cmFpbnQgZm9yIHRoaXMgZW50aXR5XG4gICAgZm9yKGkgaW4gY29uc3RyYWludE5lYXJlc3QpIHtcbiAgICAgICAgaWYoY29uc3RyYWludE5lYXJlc3RbaV0gaW5zdGFuY2VvZiBQaW5Db25zdHJhaW50ICYmIGNvbnN0cmFpbnROZWFyZXN0W2ldLmEgPT0gZW50aXR5KSB7XG4gICAgICAgICAgICBlbnRpdHkgPSBjb25zdHJhaW50TmVhcmVzdFtpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBlbnRpdHk7XG59XG4iLCIvKlxuKiAgYXV0aG9yIDogYWJoaXNoZWsgZ29zd2FtaSAoIGhpcm8gKVxuKiAgYWJoaXNoZWtnNzg1QGdtYWlsLmNvbVxuKlxuKiAgIHZlYzIuanMgOiBhIHNpbXBsZSAyLUQgdmVjdG9yIGltcGxlbWVudGF0aW9uXG4qL1xuXG5mdW5jdGlvbiBWZWMyKHgsIHkpIHtcbiAgICB0aGlzLnggPSB4IHx8IDA7XG4gICAgdGhpcy55ID0geSB8fCAwO1xufVxuXG5WZWMyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMueCArIHYueCwgdGhpcy55ICsgdi55KTtcbn1cblxuVmVjMi5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggLSB2LngsIHRoaXMueSAtIHYueSk7XG59XG5cblZlYzIucHJvdG90eXBlLm11bCA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gbmV3IFZlYzIodGhpcy54ICogdi54LCB0aGlzLnkgKiB2LnkpO1xufVxuXG5WZWMyLnByb3RvdHlwZS5kaXYgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMueCAvIHYueCwgdGhpcy55IC8gdi55KVxufVxuXG5WZWMyLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKGZhY3Rvcikge1xuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggKiBmYWN0b3IsIHRoaXMueSAqIGZhY3Rvcik7XG59XG5cblZlYzIucHJvdG90eXBlLm11dGFibGVTZXQgPSBmdW5jdGlvbih2KSB7XG4gICAgdGhpcy54ID0gdi54O1xuICAgIHRoaXMueSA9IHYueTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVmVjMi5wcm90b3R5cGUubXV0YWJsZUFkZCA9IGZ1bmN0aW9uKHYpIHtcbiAgICB0aGlzLnggKz0gdi54O1xuICAgIHRoaXMueSArPSB2Lnk7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblZlYzIucHJvdG90eXBlLm11dGFibGVTdWIgPSBmdW5jdGlvbih2KSB7XG4gICAgdGhpcy54IC09IHYueDtcbiAgICB0aGlzLnkgLT0gdi55O1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5WZWMyLnByb3RvdHlwZS5tdXRhYmxlTXVsID0gZnVuY3Rpb24odikge1xuICAgIHRoaXMueCAqPSB2Lng7XG4gICAgdGhpcy55ICo9IHYueTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVmVjMi5wcm90b3R5cGUubXV0YWJsZURpdiA9IGZ1bmN0aW9uKHYpIHtcbiAgICB0aGlzLnggLz0gdi54O1xuICAgIHRoaXMueSAvPSB2Lnk7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblZlYzIucHJvdG90eXBlLm11dGFibGVTY2FsZSA9IGZ1bmN0aW9uKGZhY3Rvcikge1xuICAgIHRoaXMueCAqPSBmYWN0b3I7XG4gICAgdGhpcy55ICo9IGZhY3RvcjtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVmVjMi5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiB0aGlzLnggPT0gdi54ICYmIHRoaXMueSA9PSB2Lnk7XG59XG5cblZlYzIucHJvdG90eXBlLmVwc2lsb25FcXVhbHMgPSBmdW5jdGlvbih2LCBlcHNpbG9uKSB7XG4gICAgcmV0dXJuIE1hdGguYWJzKHRoaXMueCAtIHYueCkgPD0gZXBzaWxvbiAmJiBNYXRoLmFicyh0aGlzLnkgLSB2LnkpIDw9IGVwc2lsb247XG59XG5cbi8vIGxlc3MgZWZmaWNpZW50IHNpbmNlIHRoZSB1c2Ugb2YgdGhlIE1hdGguc3FydCBmdW5jdGlvblxuVmVjMi5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55KTtcbn1cblxuLy8gbW9yZSBlZmZpY2llbnQgdGhhbiB0aGUgYWJvdmVcblZlYzIucHJvdG90eXBlLmxlbmd0aDIgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueTtcbn1cblxuVmVjMi5wcm90b3R5cGUuZGlzdCA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuZGlzdDIodikpO1xufVxuXG5WZWMyLnByb3RvdHlwZS5kaXN0MiA9IGZ1bmN0aW9uKHYpIHtcbiAgICB2YXIgeCA9IHYueCAtIHRoaXMueDtcbiAgICB2YXIgeSA9IHYueSAtIHRoaXMueTtcbiAgICByZXR1cm4geCp4ICsgeSp5O1xufVxuXG5WZWMyLnByb3RvdHlwZS5ub3JtYWwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbSA9IE1hdGguc3FydCh0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkpO1xuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLngvbSwgdGhpcy55L20pO1xufVxuXG5WZWMyLnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueTtcbn1cblxuVmVjMi5wcm90b3R5cGUuYW5nbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIE1hdGguYXRhbjIodGhpcy54ICogdi55IC0gdGhpcy55ICogdi54LCB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2LnkpO1xufVxuXG5WZWMyLnByb3RvdHlwZS5hbmdsZTIgPSBmdW5jdGlvbih2TGVmdCwgdlJpZ2h0KSB7XG4gICAgcmV0dXJuIHZMZWZ0LnN1Yih0aGlzKS5hbmdsZSh2UmlnaHQuc3ViKHRoaXMpKTtcbn1cblxuLypcbiAgICByb3RhdGlvbiBvZiBhIHZlY3RvciB0aHJvdWdoIGFuIGFuZ2xlIHRoZXRhIGFuZCBzaGlmdCBpbiB0aGUgb3JpZ2luXG4gICAgeCA9IHIgY29zKGluaXRpYWxfYW5nbGUpXG4gICAgeSA9IHIgc2luKGluaXRpYWxfYW5nbGUpXG4gICAgbm93IHJvdGF0aW9uIHRocm91Z2ggYW5kIGFuZ2xlIG9mIHRoZXRhXG4gICAgeCcgPSByIGNvcyhpbml0aWFsX2FuZ2xlICsgdGhldGEpXG4gICAgeScgPSByIGNvcyhpbml0aWFsX2FuZ2xlICsgdGhldGEpXG4gICAgc28gPT4geCcgPSB4IGNvcyh0aGV0YSkgLSB5IHNpbih0aGV0YSlcbiAgICAgICAgICB5JyA9IHkgY29zKHRoZXRhKSArIHggc2luKHRoZXRhKVxuICovXG5WZWMyLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbihvcmlnaW4sIHRoZXRhKSB7XG4gICAgdmFyIHggPSB0aGlzLnggLSBvcmlnaW4ueDtcbiAgICB2YXIgeSA9IHRoaXMueSAtIG9yaWdpbi55O1xuICAgIHJldHVybiBuZXcgVmVjMih4ICogTWF0aC5jb3ModGhldGEpIC0geSAqIE1hdGguc2luKHRoZXRhKSArIG9yaWdpbi54LCB4ICogTWF0aC5zaW4odGhldGEpICsgeSAqIE1hdGguY29zKHRoZXRhKSArIG9yaWdpbi55ICk7XG59XG5cblxuVmVjMi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXCIoXCIgKyB0aGlzLnggKyBcIiwgXCIgKyB0aGlzLnkgKyBcIilcIjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWZWMyOyJdfQ==
