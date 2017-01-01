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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY29uc3RyYWludC5qcyIsImxpYi9pbnRlZy5qcyIsImxpYi9vYmplY3RzLmpzIiwibGliL3BoeVNoaXQuanMiLCJsaWIvdmVjMi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuKiAgYXV0aG9yIDogYWJoaXNoZWsgZ29zd2FtaSAoIEhpcm8gKVxuKiAgYWJoaXNoZWtnNzg1QGdtYWlsLmNvbVxuKlxuKiAgY29uc3RyYWludC5qcyA6IGFkZGluZyB0aGUgY29uc3RyYWludCBvbiB0aGUgcGFydGljbGVzXG4gKi9cblxuLy8gRGlzdGFuY2VDb25zdHJhaW50IC0tIGNvbnN0cmFpbnRzIHRvIHRoZSBpbml0aWFsIGRpc3RhbmNlXG4vLyBQaW5Db25zdHJhaW50IC0tIGNvbnN0cmFpbnMgdG8gc3RhdGljL2ZpeGVkIHBvaW50c1xuLy8gQW5nbGVDb25zdHJhaW50cyAtLSBjb250YWlucyAzIHBhcnRpY2xlcyB0byBhbiBhbmdsZVxuXG52YXIgbGluZVN0cm9rZUNvbG9yID0gJ2Q4ZGRlMicsXG4gICAgUGluQ29uc3RyYWludFJhZGl1cyA9IDYsXG4gICAgUGluQ29uc3RyYWludEZpbGxDb2xvciA9ICdyZ2JhKDAsMTUzLDI1NSwwLjEpJyxcblxuICAgIEFuZ2xlQ29uc3RyYWludFN0cm9rZUNvbG9yID0gJ3JnYmEoMjU1LDI1NSwwLDAuMiknLFxuICAgIEFuZ2xlQ29uc3RyYWludExpbmVXaWR0aCA9IDU7XG5cblxuLy8gY2xhc3MgRGlzdGFuY2VDb25zdHJhaW50IGFzIGEgY29uc3RydWN0b3JcbmZ1bmN0aW9uIERpc3RhbmNlQ29uc3RyYWludChhLCBiLCBzdGlmZm5lc3MsIGRpc3RhbmNlKSB7XG4gICAgdGhpcy5hID0gYTtcbiAgICB0aGlzLmIgPSBiO1xuICAgIHRoaXMuZGlzdGFuY2UgPSB0eXBlb2YgZGlzdGFuY2UgIT0gXCJ1bmRlZmluZWRcIiA/IGRpc3RhbmNlIDogYS5wb3Muc3ViKGIucG9zKS5sZW5ndGgoKTtcbiAgICB0aGlzLnN0aWZmbmVzcyA9IHN0aWZmbmVzcztcbn1cblxuRGlzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5yZWxheCA9IGZ1bmN0aW9uKHN0ZXBDb2VmKSB7XG4gICAgdmFyIG5vcm1hbCA9IHRoaXMuYS5wb3Muc3ViKHRoaXMuYi5wb3MpO1xuICAgIHZhciBtID0gbm9ybWFsLmxlbmd0aDIoKTtcbiAgICBub3JtYWwubXV0YWJsZVNjYWxlKCgodGhpcy5kaXN0YW5jZSp0aGlzLmRpc3RhbmNlIC0gbSkvbSkqdGhpcy5zdGlmZm5lc3Mqc3RlcENvZWYpO1xuICAgIHRoaXMuYS5wb3MubXV0YWJsZUFkZChub3JtYWwpO1xuICAgIHRoaXMuYi5wb3MubXV0YWJsZVN1Yihub3JtYWwpO1xufVxuXG5EaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjdHgpIHtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4Lm1vdmVUbyh0aGlzLmEucG9zLngsIHRoaXMuYS5wb3MueSk7XG4gICAgY3R4LmxpbmVUbyh0aGlzLmIucG9zLngsIHRoaXMuYi5wb3MueSk7XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gbGluZVN0cm9rZUNvbG9yO1xuICAgIGN0eC5zdHJva2UoKTtcbn1cblxuXG4vLyBmdW5jdGlvbnMgZm9yIHBpbiBjb25zdHJhaW50IHN0YXJ0cyBoZXJlXG5cbi8vIFBpbkNvbnN0cmFpbnRzIGNvbnMgaGF2aW5nIHBhcmFtczpcbi8vIGEgOiB0aGUgcG9pbnQgdG8gd29yayBvblxuLy8gcG9zIDogcG9zaXRpb24gd2hlcmUgdG8gc2V0IHRoZSBwb2ludCBvbiB0aGUgY2FudmFzXG5mdW5jdGlvbiBQaW5Db25zdHJhaW50KGEsIHBvcykge1xuICAgIHRoaXMuYSA9IGE7XG4gICAgdGhpcy5wb3MgPSAobmV3IFZlYzIoKSkubXV0YWJsZVNldChwb3MpO1xufVxuXG5QaW5Db25zdHJhaW50LnByb3RvdHlwZS5yZWxheCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYS5wb3MubXV0YWJsZVNldCh0aGlzLnBvcyk7XG59XG5cblBpbkNvbnN0cmFpbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjdHgpIHtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4LmFyYyh0aGlzLnBvcy54LCB0aGlzLnBvcy55LCBQaW5Db25zdHJhaW50UmFkaXVzLCAwLCAyKk1hdGguUEkpO1xuICAgIGN0eC5maWxsU3R5bGUgPSBQaW5Db25zdHJhaW50RmlsbENvbG9yO1xuICAgIGN0eC5maWxsKCk7XG59XG5cblxuLy8gZnVuY3Rpb25zIGZvciB0aGUgQW5nbGVDb25zdHJhaW50XG5mdW5jdGlvbiBBbmdsZUNvbnN0cmFpbnQoYSwgYiwgYywgc3RpZmZuZXNzKSB7XG4gICAgdGhpcy5hID0gYTtcbiAgICB0aGlzLmIgPSBiO1xuICAgIHRoaXMuYyA9IGM7XG4gICAgdGhpcy5hbmdsZSA9IHRoaXMuYi5wb3MuYW5nbGUyKHRoaXMuYS5wb3MsIHRoaXMuYy5wb3MpO1xuICAgIHRoaXMuc3RpZmZuZXNzID0gc3RpZmZuZXNzO1xufVxuXG5BbmdsZUNvbnN0cmFpbnQucHJvdG90eXBlLnJlbGF4ID0gZnVuY3Rpb24oc3RlcENvZWYpIHtcbiAgICB2YXIgYW5nbGUgPSB0aGlzLmIucG9zLmFuZ2xlMih0aGlzLmEucG9zLCB0aGlzLmMucG9zKTtcbiAgICB2YXIgZGlmZiA9IGFuZ2xlID0gdGhpcy5hbmdsZTtcblxuICAgIGlmKGRpZmYgPD0gLU1hdGguUEkpIHtcbiAgICAgICAgZGlmZiArPSAyKk1hdGguUEk7XG4gICAgfVxuICAgIGVsc2UgaWYoZGlmZiA+PSBNYXRoLlBJKSB7XG4gICAgICAgIGRpZmYgLT0gMipNYXRoLlBJO1xuICAgIH1cblxuICAgIGRpZmYgKj0gc3RlcENvZWYqdGhpcy5zdGlmZm5lc3M7XG5cbiAgICB0aGlzLmEucG9zID0gdGhpcy5hLnBvcy5yb3RhdGUodGhpcy5iLnBvcywgZGlmZik7XG4gICAgdGhpcy5jLnBvcyA9IHRoaXMuYy5wb3Mucm90YXRlKHRoaXMuYi5wb3MsIC1kaWZmKTtcbiAgICB0aGlzLmIucG9zID0gdGhpcy5iLnBvcy5yb3RhdGUodGhpcy5hLnBvcywgZGlmZik7XG4gICAgdGhpcy5iLnBvcyA9IHRoaXMuYi5wb3Mucm90YXRlKHRoaXMuYy5wb3MsIC1kaWZmKTtcbn1cblxuQW5nbGVDb25zdHJhaW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY3R4KSB7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5tb3ZlVG8odGhpcy5hLnBvcy54LCB0aGlzLmEucG9zLnkpO1xuICAgIGN0eC5saW5lVG8odGhpcy5iLnBvcy54LCB0aGlzLmIucG9zLnkpO1xuICAgIGN0eC5saW5lVG8odGhpcy5jLnBvcy54LCB0aGlzLmMucG9zLnkpO1xuICAgIHZhciB0bXAgPSBjdHgubGluZVdpZHRoO1xuICAgIGN0eC5saW5lV2lkdGggPSBBbmdsZUNvbnN0cmFpbnRMaW5lV2lkdGg7XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gQW5nbGVDb25zdHJhaW50U3Ryb2tlQ29sb3I7XG4gICAgY3R4LnN0cm9rZSgpO1xuICAgIGN0eC5saW5lV2lkdGggPSB0bXA7XG59XG5cbmV4cG9ydHMuRGlzdGFuY2VDb25zdHJhaW50ID0gRGlzdGFuY2VDb25zdHJhaW50O1xuZXhwb3J0cy5QaW5Db25zdHJhaW50ID0gUGluQ29uc3RyYWludDtcbmV4cG9ydHMuQW5nbGVDb25zdHJhaW50ID0gQW5nbGVDb25zdHJhaW50OyIsIi8vIGV4cG9ydGluZyBhbGwgdGhlIGxpYnMgaGVyZSBqdXN0IGxpa2UgbmluIG5vZGUganNcbi8vIGNvb2wgOlBcblxudmFyIFBoeVNoaXQgPSByZXF1aXJlKCcuL3BoeVNoaXQnKTtcbnZhciBjb25zdHJhaW50ID0gcmVxdWlyZSgnLi9jb25zdHJhaW50Jyk7XG52YXIgb2JqZWN0cyA9IHJlcXVpcmUoJy4vb2JqZWN0cycpO1xuXG4vLyBhcHBseWluZyB0byBnbG9iYWwgd2luZG93IG9iamVjdFxud2luZG93LlZlYzIgPSByZXF1aXJlKCcuL3ZlYzInKTtcbndpbmRvdy5QaHlTaGl0ID0gUGh5U2hpdDtcblxud2luZG93LlBhcnRpY2xlID0gUGh5U2hpdC5QYXJ0aWNsZTtcblxud2luZG93LkRpc3RhbmNlQ29uc3RyYWludCA9IGNvbnN0cmFpbnQuRGlzdGFuY2VDb25zdHJhaW50XG53aW5kb3cuUGluQ29uc3RyYWludCAgICAgID0gY29uc3RyYWludC5QaW5Db25zdHJhaW50XG53aW5kb3cuQW5nbGVDb25zdHJhaW50ICAgID0gY29uc3RyYWludC5BbmdsZUNvbnN0cmFpbnQiLCIvLyBnZW5lcmljIFBoeVNoaXQgZW50aXRpZXNcblxudmFyIFBoeVNoaXQgPSByZXF1aXJlKCcuL3BoeVNoaXQnKTtcbnZhciBQYXJ0aWNsZSA9IFBoeVNoaXQuUGFydGljbGU7XG52YXIgY29uc3RyYWludHMgPSByZXF1aXJlKCcuL2NvbnN0cmFpbnQnKTtcbnZhciBEaXN0YW5jZUNvbnN0cmFpbnQgPSBjb25zdHJhaW50cy5EaXN0YW5jZUNvbnN0cmFpbnQ7XG5cbi8vIGNyZWF0aW5nIHBvaW50XG5QaHlTaGl0LnByb3RvdHlwZS5wb2ludCA9IGZ1bmN0aW9uKHBvcykge1xuICAgIHZhciBjb21wb3NpdGUgPSBuZXcgdGhpcy5Db21wb3NpdGUoKTtcbiAgICBjb21wb3NpdGUucGFydGljbGVzLnB1c2gobmV3IFBhcnRpY2xlKHBvcykpO1xuICAgIHRoaXMuY29tcG9zaXRlcy5wdXNoKGNvbXBvc2l0ZSk7XG4gICAgcmV0dXJuIGNvbXBvc2l0ZTtcbn1cblxuLy8gY3JlYXRpbmcgbGluZSBzZWdtZW50XG5QaHlTaGl0LnByb3RvdHlwZS5saW5lU2VnbWVudHMgPSBmdW5jdGlvbih2ZXJ0aWNlcywgc3RpZmZuZXNzKSB7XG4gICAgdmFyIGk7XG4gICAgdmFyIGNvbXBvc2l0ZSA9IG5ldyB0aGlzLkNvbXBvc2l0ZSgpO1xuXG4gICAgZm9yKGkgaW4gdmVydGljZXMpIHtcbiAgICAgICAgY29tcG9zaXRlLnBhcnRpY2xlcy5wdXNoKG5ldyBQYXJ0aWNsZSh2ZXJ0aWNlc1tpXSkpO1xuICAgICAgICBpZihpID4gMCkge1xuICAgICAgICAgICAgY29tcG9zaXRlLmNvbnN0cmFpbnRzLnB1c2gobmV3IERpc3RhbmNlQ29uc3RyYWludChjb21wb3NpdGUucGFydGljbGVzW2ldLCBjb21wb3NpdGUucGFydGljbGVzW2ktMV0sIHN0aWZmbmVzcykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jb21wb3NpdGVzLnB1c2goY29tcG9zaXRlKTtcbiAgICByZXR1cm4gY29tcG9zaXRlO1xufVxuXG4vLyBjcmVhdGluZyBhIHNoYXBlcywganVzdCBjaGFuZ2UgdGhlIG5vIG9mIHNlZ21lbnRzXG5QaHlTaGl0LnByb3RvdHlwZS50aXJlID0gZnVuY3Rpb24ob3JpZ2luLCByYWRpdXMsIHNlZ21lbnRzLCBzcG9rZVN0aWZmbmVzcywgdHJlYWRTdGlmZm5lc3MpIHtcbiAgICB2YXIgc3RyaWRlID0gKDIqTWF0aC5QSSkgL3NlZ21lbnRzO1xuICAgIHZhciBpO1xuXG4gICAgdmFyIGNvbXBvc2l0ZSA9IG5ldyB0aGlzLkNvbXBvc2l0ZSgpO1xuXG4gICAgLy8gcGFydGljbGVzXG4gICAgZm9yKHZhciBpID0gMCA7IGkgPCBzZWdtZW50czsgaSsrKSB7XG4gICAgICAgIHZhciB0aGV0YSA9IGkgKiBzdHJpZGU7XG4gICAgICAgIGNvbXBvc2l0ZS5wYXJ0aWNsZXMucHVzaChuZXcgUGFydGljbGUobmV3IFZlYzIob3JpZ2luLnggKyBNYXRoLmNvcyh0aGV0YSkgKiByYWRpdXMsIG9yaWdpbi55ICsgTWF0aC5zaW4odGhldGEpICogcmFkaXVzKSkpO1xuICAgIH1cblxuICAgIHZhciBjZW50ZXIgPSBuZXcgUGFydGljbGUob3JpZ2luKTtcbiAgICBjb21wb3NpdGUucGFydGljbGVzLnB1c2goY2VudGVyKTtcblxuICAgIC8vIGNvbnN0cmFpbnRzXG4gICAgZm9yKGkgPSAwIDtpIDwgc2VnbWVudHM7IGkrKykge1xuICAgICAgICBjb21wb3NpdGUuY29uc3RyYWludHMucHVzaChuZXcgRGlzdGFuY2VDb25zdHJhaW50KGNvbXBvc2l0ZS5wYXJ0aWNsZXNbaV0sIGNvbXBvc2l0ZS5wYXJ0aWNsZXNbKGkrMSklc2VnbWVudHNdLCB0cmVhZFN0aWZmbmVzcykpO1xuICAgICAgICBjb21wb3NpdGUuY29uc3RyYWludHMucHVzaChuZXcgRGlzdGFuY2VDb25zdHJhaW50KGNvbXBvc2l0ZS5wYXJ0aWNsZXNbaV0sIGNlbnRlciwgc3Bva2VTdGlmZm5lc3MpKTtcbiAgICAgICAgY29tcG9zaXRlLmNvbnN0cmFpbnRzLnB1c2gobmV3IERpc3RhbmNlQ29uc3RyYWludChjb21wb3NpdGUucGFydGljbGVzW2ldLCBjb21wb3NpdGUucGFydGljbGVzWyhpKzUpJXNlZ21lbnRzXSwgdHJlYWRTdGlmZm5lc3MpKTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbXBvc2l0ZXMucHVzaChjb21wb3NpdGUpO1xuICAgIHJldHVybiBjb21wb3NpdGU7XG59IiwiLypcbiogIGF1dGhvciA6IGFiaGlzaGVrIGdvc3dhbWkgKCBoaXJvIClcbiogIGFiaGlzaGVrZzc4NUBnbWFpbC5jb21cbipcbiogIHBoeVNoaXQuanNcbiAqL1xuXG53aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZVxufHwgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZVxufHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZVxufHwgd2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbnx8IHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZVxufHwgZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDEwMDAgLyA2MCk7XG59XG5cbi8vIHJlcXVpcmUgMmQgaW1wbGVtZW50YXRpb24gb2YgMmQgdmVjdG9yXG52YXIgVmVjMiA9IHJlcXVpcmUoJy4vdmVjMicpO1xuXG4vLyBmb3IgZXhwb3J0aW5nIG1vZHVsZXNcbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IFBoeVNoaXQ7XG5leHBvcnRzLlBhcnRpY2xlID0gUGFydGljbGU7XG5leHBvcnRzLkNvbXBvc2l0ZSA9IENvbXBvc2l0ZTtcblxudmFyIEdsb2JhbFZhcmlhYmxlcyA9IHtcbiAgICAncGFydGljbGVSYWRpdXMnIDogMixcbiAgICAncGFydGljbGVDb2xvcicgOiAnIzJkYWQ4ZicsXG4gICAgJ2hpZ2hsaWdodGVkUGFydGljbGVSYWRpdXMnIDogOCxcbn1cblxuLy8gY3JlYXRlZCBhIG5ldyBwYXJ0aWNsZVxuZnVuY3Rpb24gUGFydGljbGUocG9zKSB7XG4gICAgdGhpcy5wb3MgPSAobmV3IFZlYzIoKSkubXV0YWJsZVNldChwb3MpO1xuICAgIHRoaXMubGFzdFBvcyA9IChuZXcgVmVjMigpKS5tdXRhYmxlU2V0KHBvcyk7XG59XG5cbi8vIGRyYXcgYSBwYXJ0aWNsZSBvbiB0aGUgY2FudmFzXG5QYXJ0aWNsZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGN0eCkge1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHguYXJjKHRoaXMucG9zLngsIHRoaXMucG9zLnksIEdsb2JhbFZhcmlhYmxlcy5wYXJ0aWNsZVJhZGl1cywgMCwgMipNYXRoLlBJKTtcbiAgICBjdHguZmlsbFN0eWxlID0gR2xvYmFsVmFyaWFibGVzLnBhcnRpY2xlQ29sb3I7XG4gICAgY3R4LmZpbGwoKTtcbn1cblxuLy8gbWFpbiBjbGFzc1xuZnVuY3Rpb24gUGh5U2hpdCh3aWR0aCwgaGVpZ2h0LCBjYW52YXMpIHtcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XG4gICAgdGhpcy5jdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLm1vdXNlID0gbmV3IFZlYzIoMCwwKTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMuZHJhZ2dlZEVudGl0eSA9IG51bGw7XG4gICAgdGhpcy5zZWxlY3Rpb25SYWRpdXMgPSAyMDtcbiAgICB0aGlzLmhpZ2hsaWdodENvbG9yID0gXCIjNGY1NDVjXCI7XG5cbiAgICB0aGlzLmJvdW5kcyA9IGZ1bmN0aW9uKHBhcnRpY2xlKSB7XG5cbiAgICAgICAgaWYocGFydGljbGUucG9zLnkgPiB0aGlzLmhlaWdodCAtIDEpIHtcbiAgICAgICAgICAgIHBhcnRpY2xlLnBvcy55ID0gdGhpcy5oZWlnaHQgLSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYocGFydGljbGUucG9zLnggPCAwKSB7XG4gICAgICAgICAgICBwYXJ0aWNsZS5wb3MueCA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZihwYXJ0aWNsZS5wb3MueCA+IHRoaXMud2lkdGggLSAxKSB7XG4gICAgICAgICAgICBwYXJ0aWNsZS5wb3MueCA9IHRoaXMud2lkdGggLSAxO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gcHJldmVudHMgY29udGV4dCBtZW51XG4gICAgdGhpcy5jYW52YXMub25jb250ZXh0bWVudSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIHRoaXMuY2FudmFzLm9ubW91c2Vkb3duID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBfdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICB2YXIgbmVhcmVzdCA9IF90aGlzLm5lYXJlc3RFbnRpdHkoKTtcbiAgICAgICAgaWYobmVhcmVzdCkge1xuICAgICAgICAgICAgX3RoaXMuZHJhZ2dlZEVudGl0eSA9IG5lYXJlc3Q7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNhbnZhcy5vbm1vdXNldXAgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIF90aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICBfdGhpcy5kcmFnZ2VkRW50aXR5ID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBnZXRCb3VuZGluZ0NsaWVudFJlY3QgcmV0dXJucyB0aGUgc2l6ZSBvZiBhbiBlbGVtZW50IGFuZCBpdHNcbiAgICAvLyBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnRcbiAgICAvLyB0aGlzIGZ1bmN0aW9uIHNldHMgdGhlIG1vdXNlIHBvc2l0aW9uIHcuciB0byB0aGUgY2FudmFzXG4gICAgdGhpcy5jYW52YXMub25tb3VzZW1vdmUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciByZWN0ID0gX3RoaXMuY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBfdGhpcy5tb3VzZS54ID0gZS5jbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgICAgICBfdGhpcy5tb3VzZS55ID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgfVxuXG4gICAgLy8gcGFyYW1ldGVycyBmb3Igc2ltdWxhdGlvblxuICAgIHRoaXMuZ3Jhdml0eSA9IG5ldyBWZWMyKDAsIDAuMik7XG4gICAgdGhpcy5mcmljdGlvbiA9IDAuOTk7XG4gICAgdGhpcy5ncm91bmRGcmljdGlvbiA9IDAuODtcblxuICAgIC8vIGhvbGRzIGNvbXBvc2l0ZSBlbnRpdGllc1xuICAgIHRoaXMuY29tcG9zaXRlcyA9IFtdOyAgIC8vIG9iamVjdCBvZiB0aGUgY29tcG9zaXRlIGNsYXNzXG5cbn1cblxuUGh5U2hpdC5wcm90b3R5cGUuQ29tcG9zaXRlID0gQ29tcG9zaXRlO1xuXG5mdW5jdGlvbiBDb21wb3NpdGUoKSB7XG4gICAgdGhpcy5wYXJ0aWNsZXMgPSBbXTsgICAvLyBjb250YWlucyB0aGUgcGFydGljbGVzIHRvIHBsYXkgd2l0aCA6UFxuICAgIHRoaXMuY29uc3RyYWludHMgPSBbXTsgIC8vIGNvbnRhaW5zIHRoZSBjb25zdHJhaW5zIGFwcGxpZWQgb24gdGhlbVxuXG4gICAgdGhpcy5kcmF3UGFydGljbGVzID0gbnVsbDtcbiAgICB0aGlzLmRyYXdDb25zdHJhaW50cyA9IG51bGw7XG59XG5cbkNvbXBvc2l0ZS5wcm90b3R5cGUucGluID0gZnVuY3Rpb24oaW5kZXgsIHBvcykge1xuICAgIHBvcyA9IHBvcyB8fCB0aGlzLnBhcnRpY2xlc1tpbmRleF0ucG9zO1xuICAgIHZhciBwYyA9IG5ldyBQaW5Db25zdHJhaW50KHRoaXMucGFydGljbGVzW2luZGV4XSwgcG9zKTtcbiAgICB0aGlzLmNvbnN0cmFpbnRzLnB1c2gocGMpO1xuICAgIHJldHVybiBwYztcbn1cblxuUGh5U2hpdC5wcm90b3R5cGUuZnJhbWUgPSBmdW5jdGlvbihzdGVwKSB7XG4gICAgdmFyIGksIGogLGM7XG5cbiAgICBmb3IoYyBpbiB0aGlzLmNvbXBvc2l0ZXMpIHtcbiAgICAgICAgZm9yKGkgaW4gdGhpcy5jb21wb3NpdGVzW2NdLnBhcnRpY2xlcykge1xuICAgICAgICAgICAgdmFyIHBhcnRpY2xlcyA9IHRoaXMuY29tcG9zaXRlc1tjXS5wYXJ0aWNsZXM7XG5cbiAgICAgICAgICAgIC8vIGNhbGN1bGF0ZSB2ZWxvY2l0eVxuICAgICAgICAgICAgdmFyIHZlbG9jaXR5ID0gcGFydGljbGVzW2ldLnBvcy5zdWIocGFydGljbGVzW2ldLmxhc3RQb3MpLnNjYWxlKHRoaXMuZnJpY3Rpb24pO1xuXG4gICAgICAgICAgICAvLyBncm91bmQgZnJpY3Rpb25cbiAgICAgICAgICAgIGlmKHBhcnRpY2xlc1tpXS5wb3MueSA+PSB0aGlzLmhlaWdodCAtIDEgJiYgdmVsb2NpdHkubGVuZ3RoMigpID4gMC4wMDAwMDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgbSA9IHZlbG9jaXR5Lmxlbmd0aCgpO1xuICAgICAgICAgICAgICAgIHZlbG9jaXR5LnggLz0gbTtcbiAgICAgICAgICAgICAgICB2ZWxvY2l0eS55IC89IG07XG4gICAgICAgICAgICAgICAgdmVsb2NpdHkubXV0YWJsZVNjYWxlKG0gKiB0aGlzLmdyb3VuZEZyaWN0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2F2ZSBsYXN0IGdvb2Qgc3RhdGVcbiAgICAgICAgICAgIHBhcnRpY2xlc1tpXS5sYXN0UG9zLm11dGFibGVTZXQocGFydGljbGVzW2ldLnBvcyk7XG5cbiAgICAgICAgICAgIC8vIGFkZGluZyBncmF2aXR5XG4gICAgICAgICAgICBwYXJ0aWNsZXNbaV0ucG9zLm11dGFibGVBZGQodGhpcy5ncmF2aXR5KTtcblxuICAgICAgICAgICAgLy8gYWRkaW5nIGluZXJ0aWFcbiAgICAgICAgICAgIHBhcnRpY2xlc1tpXS5wb3MubXV0YWJsZUFkZCh2ZWxvY2l0eSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBoYW5kbGUgZHJhZ2dpbmcgb2YgZW50aXRpZXNcbiAgICBpZih0aGlzLmRyYWdnZWRFbnRpdHkpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2RyYWdnaW5nIHRvIHRoZSBtb3VzZScgKyB0aGlzLm1vdXNlKTtcbiAgICAgICAgdGhpcy5kcmFnZ2VkRW50aXR5LnBvcy5tdXRhYmxlU2V0KHRoaXMubW91c2UpO1xuICAgIH1cblxuICAgIC8vcmVsYXhcbiAgICB2YXIgc3RlcENvZWYgPSAxIC8gc3RlcDtcbiAgICBmb3IoYyBpbiB0aGlzLmNvbXBvc2l0ZXMpIHtcbiAgICAgICAgdmFyIGNvbnN0cmFpbnRzID0gdGhpcy5jb21wb3NpdGVzW2NdLmNvbnN0cmFpbnRzO1xuICAgICAgICBmb3IodmFyIGkgPSAwIDsgaSA8IHN0ZXA7IGkrKykge1xuICAgICAgICAgICAgZm9yKCBqIGluIGNvbnN0cmFpbnRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3RyYWludHNbal0ucmVsYXgoc3RlcENvZWYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gYm91bmQgY2hlY2tpbmdcbiAgICBmb3IoYyBpbiB0aGlzLmNvbXBvc2l0ZXMpIHtcbiAgICAgICAgdmFyIHBhcnRpY2xlcyA9IHRoaXMuY29tcG9zaXRlc1tjXS5wYXJ0aWNsZXM7XG4gICAgICAgIGZvcihpIGluIHBhcnRpY2xlcykge1xuICAgICAgICAgICAgdGhpcy5ib3VuZHMocGFydGljbGVzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuUGh5U2hpdC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpLGM7XG5cbiAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG5cbiAgICBmb3IoYyBpbiB0aGlzLmNvbXBvc2l0ZXMpIHtcbiAgICAgICAgLy8gZHJhdyBjb25zdHJhaW50c1xuICAgICAgICBpZih0aGlzLmNvbXBvc2l0ZXNbY10uZHJhd0NvbnN0cmFpbnRzKSB7XG4gICAgICAgICAgICB0aGlzLmNvbXBvc2l0ZXNbY10uZHJhd0NvbnN0cmFpbnRzKHRoaXMuY3R4LCB0aGlzLmNvbXBvc2l0ZXNbY10pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgICB2YXIgY29uc3RyYWludHMgPSB0aGlzLmNvbXBvc2l0ZXNbY10uY29uc3RyYWludHM7XG4gICAgICAgICAgICBmb3IoaSBpbiBjb25zdHJhaW50cykge1xuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzW2ldLmRyYXcodGhpcy5jdHgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gZHJhdyBwYXJ0aWNsZXNcbiAgICBpZih0aGlzLmNvbXBvc2l0ZXNbY10uZHJhd1BhcnRpY2xlcykge1xuICAgICAgICB0aGlzLmNvbXBvc2l0ZXNbY10uZHJhd1BhcnRpY2xlcyh0aGlzLmN0eCwgdGhpcy5jb21wb3NpdGVzW2NdKTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgdmFyIHBhcnRpY2xlcyA9IHRoaXMuY29tcG9zaXRlc1tjXS5wYXJ0aWNsZXM7XG4gICAgICAgIGZvcihpIGluIHBhcnRpY2xlcykge1xuICAgICAgICAgICAgcGFydGljbGVzW2ldLmRyYXcodGhpcy5jdHgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gaGlnaGxpZ2h0IG5lYXJlc3QgLyBkcmFnZ2VkIGVudGl0eVxuICAgIHZhciBuZWFyZXN0ID0gdGhpcy5kcmFnZ2VkRW50aXR5IHx8IHRoaXMubmVhcmVzdEVudGl0eSgpO1xuICAgIGlmKG5lYXJlc3QpIHtcbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4LmFyYyhuZWFyZXN0LnBvcy54LCBuZWFyZXN0LnBvcy55LCBHbG9iYWxWYXJpYWJsZXMuaGlnaGxpZ2h0ZWRQYXJ0aWNsZVJhZGl1cywgMCwgMiAqIE1hdGguUEkpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IHRoaXMuaGlnaGxpZ2h0Q29sb3I7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgIH1cbn1cblxuUGh5U2hpdC5wcm90b3R5cGUubmVhcmVzdEVudGl0eSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjLCBpO1xuICAgIHZhciBkMk5lYXJlc3QgPSAwO1xuICAgIHZhciBlbnRpdHkgPSBudWxsO1xuICAgIHZhciBjb25zdHJhaW50TmVhcmVzdCA9IG51bGw7XG5cbiAgICAvLyBmaW5kIG5lYXJlc3QgcG9pbnRcbiAgICBmb3IoYyBpbiB0aGlzLmNvbXBvc2l0ZXMpIHtcbiAgICAgICAgdmFyIHBhcnRpY2xlcyA9IHRoaXMuY29tcG9zaXRlc1tjXS5wYXJ0aWNsZXM7XG4gICAgICAgIGZvcihpIGluIHBhcnRpY2xlcykge1xuICAgICAgICAgICAgdmFyIGQyID0gcGFydGljbGVzW2ldLnBvcy5kaXN0Mih0aGlzLm1vdXNlKTtcbiAgICAgICAgICAgIGlmKGQyIDw9IHRoaXMuc2VsZWN0aW9uUmFkaXVzICogdGhpcy5zZWxlY3Rpb25SYWRpdXMgJiYgKGVudGl0eSA9PSBudWxsIHx8IGQyIDwgZDJOZWFyZXN0KSkge1xuICAgICAgICAgICAgICAgIGVudGl0eSA9IHBhcnRpY2xlc1tpXTtcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50TmVhcmVzdCA9IHRoaXMuY29tcG9zaXRlc1tjXS5jb25zdHJhaW50cztcbiAgICAgICAgICAgICAgICBkMk5lYXJlc3QgPSBkMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNlYXJjaCBmb3IgcGlubmVkIGNvbnN0cmFpbnQgZm9yIHRoaXMgZW50aXR5XG4gICAgZm9yKGkgaW4gY29uc3RyYWludE5lYXJlc3QpIHtcbiAgICAgICAgaWYoY29uc3RyYWludE5lYXJlc3RbaV0gaW5zdGFuY2VvZiBQaW5Db25zdHJhaW50ICYmIGNvbnN0cmFpbnROZWFyZXN0W2ldLmEgPT0gZW50aXR5KSB7XG4gICAgICAgICAgICBlbnRpdHkgPSBjb25zdHJhaW50TmVhcmVzdFtpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBlbnRpdHk7XG59XG4iLCIvKlxuKiAgYXV0aG9yIDogYWJoaXNoZWsgZ29zd2FtaSAoIGhpcm8gKVxuKiAgYWJoaXNoZWtnNzg1QGdtYWlsLmNvbVxuKlxuKiAgIHZlYzIuanMgOiBhIHNpbXBsZSAyLUQgdmVjdG9yIGltcGxlbWVudGF0aW9uXG4qL1xuXG5mdW5jdGlvbiBWZWMyKHgsIHkpIHtcbiAgICB0aGlzLnggPSB4IHx8IDA7XG4gICAgdGhpcy55ID0geSB8fCAwO1xufVxuXG5WZWMyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMueCArIHYueCwgdGhpcy55ICsgdi55KTtcbn1cblxuVmVjMi5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggLSB2LngsIHRoaXMueSAtIHYueSk7XG59XG5cblZlYzIucHJvdG90eXBlLm11bCA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gbmV3IFZlYzIodGhpcy54ICogdi54LCB0aGlzLnkgKiB2LnkpO1xufVxuXG5WZWMyLnByb3RvdHlwZS5kaXYgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMueCAvIHYueCwgdGhpcy55IC8gdi55KVxufVxuXG5WZWMyLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKGZhY3Rvcikge1xuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggKiBmYWN0b3IsIHRoaXMueSAqIGZhY3Rvcik7XG59XG5cblZlYzIucHJvdG90eXBlLm11dGFibGVTZXQgPSBmdW5jdGlvbih2KSB7XG4gICAgdGhpcy54ID0gdi54O1xuICAgIHRoaXMueSA9IHYueTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVmVjMi5wcm90b3R5cGUubXV0YWJsZUFkZCA9IGZ1bmN0aW9uKHYpIHtcbiAgICB0aGlzLnggKz0gdi54O1xuICAgIHRoaXMueSArPSB2Lnk7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblZlYzIucHJvdG90eXBlLm11dGFibGVTdWIgPSBmdW5jdGlvbih2KSB7XG4gICAgdGhpcy54IC09IHYueDtcbiAgICB0aGlzLnkgLT0gdi55O1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5WZWMyLnByb3RvdHlwZS5tdXRhYmxlTXVsID0gZnVuY3Rpb24odikge1xuICAgIHRoaXMueCAqPSB2Lng7XG4gICAgdGhpcy55ICo9IHYueTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVmVjMi5wcm90b3R5cGUubXV0YWJsZURpdiA9IGZ1bmN0aW9uKHYpIHtcbiAgICB0aGlzLnggLz0gdi54O1xuICAgIHRoaXMueSAvPSB2Lnk7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblZlYzIucHJvdG90eXBlLm11dGFibGVTY2FsZSA9IGZ1bmN0aW9uKGZhY3Rvcikge1xuICAgIHRoaXMueCAqPSBmYWN0b3I7XG4gICAgdGhpcy55ICo9IGZhY3RvcjtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVmVjMi5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiB0aGlzLnggPT0gdi54ICYmIHRoaXMueSA9PSB2Lnk7XG59XG5cblZlYzIucHJvdG90eXBlLmVwc2lsb25FcXVhbHMgPSBmdW5jdGlvbih2LCBlcHNpbG9uKSB7XG4gICAgcmV0dXJuIE1hdGguYWJzKHRoaXMueCAtIHYueCkgPD0gZXBzaWxvbiAmJiBNYXRoLmFicyh0aGlzLnkgLSB2LnkpIDw9IGVwc2lsb247XG59XG5cbi8vIGxlc3MgZWZmaWNpZW50IHNpbmNlIHRoZSB1c2Ugb2YgdGhlIE1hdGguc3FydCBmdW5jdGlvblxuVmVjMi5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55KTtcbn1cblxuLy8gbW9yZSBlZmZpY2llbnQgdGhhbiB0aGUgYWJvdmVcblZlYzIucHJvdG90eXBlLmxlbmd0aDIgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueTtcbn1cblxuVmVjMi5wcm90b3R5cGUuZGlzdCA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuZGlzdDIodikpO1xufVxuXG5WZWMyLnByb3RvdHlwZS5kaXN0MiA9IGZ1bmN0aW9uKHYpIHtcbiAgICB2YXIgeCA9IHYueCAtIHRoaXMueDtcbiAgICB2YXIgeSA9IHYueSAtIHRoaXMueTtcbiAgICByZXR1cm4geCp4ICsgeSp5O1xufVxuXG5WZWMyLnByb3RvdHlwZS5ub3JtYWwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbSA9IE1hdGguc3FydCh0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkpO1xuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLngvbSwgdGhpcy55L20pO1xufVxuXG5WZWMyLnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueTtcbn1cblxuVmVjMi5wcm90b3R5cGUuYW5nbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIE1hdGguYXRhbjIodGhpcy54ICogdi55IC0gdGhpcy55ICogdi54LCB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2LnkpO1xufVxuXG5WZWMyLnByb3RvdHlwZS5hbmdsZTIgPSBmdW5jdGlvbih2TGVmdCwgdlJpZ2h0KSB7XG4gICAgcmV0dXJuIHZMZWZ0LnN1Yih0aGlzKS5hbmdsZSh2UmlnaHQuc3ViKHRoaXMpKTtcbn1cblxuLypcbiAgICByb3RhdGlvbiBvZiBhIHZlY3RvciB0aHJvdWdoIGFuIGFuZ2xlIHRoZXRhIGFuZCBzaGlmdCBpbiB0aGUgb3JpZ2luXG4gICAgeCA9IHIgY29zKGluaXRpYWxfYW5nbGUpXG4gICAgeSA9IHIgc2luKGluaXRpYWxfYW5nbGUpXG4gICAgbm93IHJvdGF0aW9uIHRocm91Z2ggYW5kIGFuZ2xlIG9mIHRoZXRhXG4gICAgeCcgPSByIGNvcyhpbml0aWFsX2FuZ2xlICsgdGhldGEpXG4gICAgeScgPSByIGNvcyhpbml0aWFsX2FuZ2xlICsgdGhldGEpXG4gICAgc28gPT4geCcgPSB4IGNvcyh0aGV0YSkgLSB5IHNpbih0aGV0YSlcbiAgICAgICAgICB5JyA9IHkgY29zKHRoZXRhKSArIHggc2luKHRoZXRhKVxuICovXG5WZWMyLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbihvcmlnaW4sIHRoZXRhKSB7XG4gICAgdmFyIHggPSB0aGlzLnggLSBvcmlnaW4ueDtcbiAgICB2YXIgeSA9IHRoaXMueSAtIG9yaWdpbi55O1xuICAgIHJldHVybiBuZXcgVmVjMih4ICogTWF0aC5jb3ModGhldGEpIC0geSAqIE1hdGguc2luKHRoZXRhKSArIG9yaWdpbi54LCB4ICogTWF0aC5zaW4odGhldGEpICsgeSAqIE1hdGguY29zKHRoZXRhKSArIG9yaWdpbi55ICk7XG59XG5cblxuVmVjMi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXCIoXCIgKyB0aGlzLnggKyBcIiwgXCIgKyB0aGlzLnkgKyBcIilcIjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWZWMyOyJdfQ==
