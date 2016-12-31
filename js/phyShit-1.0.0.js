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

/*
 Copyright 2013 Sub Protocol and other contributors
 http://subprotocol.com/

 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY29uc3RyYWludC5qcyIsImxpYi9pbnRlZy5qcyIsImxpYi9vYmplY3RzLmpzIiwibGliL3BoeVNoaXQuanMiLCJsaWIvdmVjMi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypcbiogIGF1dGhvciA6IGFiaGlzaGVrIGdvc3dhbWkgKCBIaXJvIClcbiogIGFiaGlzaGVrZzc4NUBnbWFpbC5jb21cbipcbiogIGNvbnN0cmFpbnQuanMgOiBhZGRpbmcgdGhlIGNvbnN0cmFpbnQgb24gdGhlIHBhcnRpY2xlc1xuICovXG5cbi8vIERpc3RhbmNlQ29uc3RyYWludCAtLSBjb25zdHJhaW50cyB0byB0aGUgaW5pdGlhbCBkaXN0YW5jZVxuLy8gUGluQ29uc3RyYWludCAtLSBjb25zdHJhaW5zIHRvIHN0YXRpYy9maXhlZCBwb2ludHNcbi8vIEFuZ2xlQ29uc3RyYWludHMgLS0gY29udGFpbnMgMyBwYXJ0aWNsZXMgdG8gYW4gYW5nbGVcblxudmFyIGxpbmVTdHJva2VDb2xvciA9ICdkOGRkZTInLFxuICAgIFBpbkNvbnN0cmFpbnRSYWRpdXMgPSA2LFxuICAgIFBpbkNvbnN0cmFpbnRGaWxsQ29sb3IgPSAncmdiYSgwLDE1MywyNTUsMC4xKScsXG5cbiAgICBBbmdsZUNvbnN0cmFpbnRTdHJva2VDb2xvciA9ICdyZ2JhKDI1NSwyNTUsMCwwLjIpJyxcbiAgICBBbmdsZUNvbnN0cmFpbnRMaW5lV2lkdGggPSA1O1xuXG5cbi8vIGNsYXNzIERpc3RhbmNlQ29uc3RyYWludCBhcyBhIGNvbnN0cnVjdG9yXG5mdW5jdGlvbiBEaXN0YW5jZUNvbnN0cmFpbnQoYSwgYiwgc3RpZmZuZXNzLCBkaXN0YW5jZSkge1xuICAgIHRoaXMuYSA9IGE7XG4gICAgdGhpcy5iID0gYjtcbiAgICB0aGlzLmRpc3RhbmNlID0gdHlwZW9mIGRpc3RhbmNlICE9IFwidW5kZWZpbmVkXCIgPyBkaXN0YW5jZSA6IGEucG9zLnN1YihiLnBvcykubGVuZ3RoKCk7XG4gICAgdGhpcy5zdGlmZm5lc3MgPSBzdGlmZm5lc3M7XG59XG5cbkRpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUucmVsYXggPSBmdW5jdGlvbihzdGVwQ29lZikge1xuICAgIHZhciBub3JtYWwgPSB0aGlzLmEucG9zLnN1Yih0aGlzLmIucG9zKTtcbiAgICB2YXIgbSA9IG5vcm1hbC5sZW5ndGgyKCk7XG4gICAgbm9ybWFsLm11dGFibGVTY2FsZSgoKHRoaXMuZGlzdGFuY2UqdGhpcy5kaXN0YW5jZSAtIG0pL20pKnRoaXMuc3RpZmZuZXNzKnN0ZXBDb2VmKTtcbiAgICB0aGlzLmEucG9zLm11dGFibGVBZGQobm9ybWFsKTtcbiAgICB0aGlzLmIucG9zLm11dGFibGVTdWIobm9ybWFsKTtcbn1cblxuRGlzdGFuY2VDb25zdHJhaW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY3R4KSB7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5tb3ZlVG8odGhpcy5hLnBvcy54LCB0aGlzLmEucG9zLnkpO1xuICAgIGN0eC5saW5lVG8odGhpcy5iLnBvcy54LCB0aGlzLmIucG9zLnkpO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IGxpbmVTdHJva2VDb2xvcjtcbiAgICBjdHguc3Ryb2tlKCk7XG59XG5cblxuLy8gZnVuY3Rpb25zIGZvciBwaW4gY29uc3RyYWludCBzdGFydHMgaGVyZVxuXG4vLyBQaW5Db25zdHJhaW50cyBjb25zIGhhdmluZyBwYXJhbXM6XG4vLyBhIDogdGhlIHBvaW50IHRvIHdvcmsgb25cbi8vIHBvcyA6IHBvc2l0aW9uIHdoZXJlIHRvIHNldCB0aGUgcG9pbnQgb24gdGhlIGNhbnZhc1xuZnVuY3Rpb24gUGluQ29uc3RyYWludChhLCBwb3MpIHtcbiAgICB0aGlzLmEgPSBhO1xuICAgIHRoaXMucG9zID0gKG5ldyBWZWMyKCkpLm11dGFibGVTZXQocG9zKTtcbn1cblxuUGluQ29uc3RyYWludC5wcm90b3R5cGUucmVsYXggPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmEucG9zLm11dGFibGVTZXQodGhpcy5wb3MpO1xufVxuXG5QaW5Db25zdHJhaW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY3R4KSB7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5hcmModGhpcy5wb3MueCwgdGhpcy5wb3MueSwgUGluQ29uc3RyYWludFJhZGl1cywgMCwgMipNYXRoLlBJKTtcbiAgICBjdHguZmlsbFN0eWxlID0gUGluQ29uc3RyYWludEZpbGxDb2xvcjtcbiAgICBjdHguZmlsbCgpO1xufVxuXG5cbi8vIGZ1bmN0aW9ucyBmb3IgdGhlIEFuZ2xlQ29uc3RyYWludFxuZnVuY3Rpb24gQW5nbGVDb25zdHJhaW50KGEsIGIsIGMsIHN0aWZmbmVzcykge1xuICAgIHRoaXMuYSA9IGE7XG4gICAgdGhpcy5iID0gYjtcbiAgICB0aGlzLmMgPSBjO1xuICAgIHRoaXMuYW5nbGUgPSB0aGlzLmIucG9zLmFuZ2xlMih0aGlzLmEucG9zLCB0aGlzLmMucG9zKTtcbiAgICB0aGlzLnN0aWZmbmVzcyA9IHN0aWZmbmVzcztcbn1cblxuQW5nbGVDb25zdHJhaW50LnByb3RvdHlwZS5yZWxheCA9IGZ1bmN0aW9uKHN0ZXBDb2VmKSB7XG4gICAgdmFyIGFuZ2xlID0gdGhpcy5iLnBvcy5hbmdsZTIodGhpcy5hLnBvcywgdGhpcy5jLnBvcyk7XG4gICAgdmFyIGRpZmYgPSBhbmdsZSA9IHRoaXMuYW5nbGU7XG5cbiAgICBpZihkaWZmIDw9IC1NYXRoLlBJKSB7XG4gICAgICAgIGRpZmYgKz0gMipNYXRoLlBJO1xuICAgIH1cbiAgICBlbHNlIGlmKGRpZmYgPj0gTWF0aC5QSSkge1xuICAgICAgICBkaWZmIC09IDIqTWF0aC5QSTtcbiAgICB9XG5cbiAgICBkaWZmICo9IHN0ZXBDb2VmKnRoaXMuc3RpZmZuZXNzO1xuXG4gICAgdGhpcy5hLnBvcyA9IHRoaXMuYS5wb3Mucm90YXRlKHRoaXMuYi5wb3MsIGRpZmYpO1xuICAgIHRoaXMuYy5wb3MgPSB0aGlzLmMucG9zLnJvdGF0ZSh0aGlzLmIucG9zLCAtZGlmZik7XG4gICAgdGhpcy5iLnBvcyA9IHRoaXMuYi5wb3Mucm90YXRlKHRoaXMuYS5wb3MsIGRpZmYpO1xuICAgIHRoaXMuYi5wb3MgPSB0aGlzLmIucG9zLnJvdGF0ZSh0aGlzLmMucG9zLCAtZGlmZik7XG59XG5cbkFuZ2xlQ29uc3RyYWludC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGN0eCkge1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgubW92ZVRvKHRoaXMuYS5wb3MueCwgdGhpcy5hLnBvcy55KTtcbiAgICBjdHgubGluZVRvKHRoaXMuYi5wb3MueCwgdGhpcy5iLnBvcy55KTtcbiAgICBjdHgubGluZVRvKHRoaXMuYy5wb3MueCwgdGhpcy5jLnBvcy55KTtcbiAgICB2YXIgdG1wID0gY3R4LmxpbmVXaWR0aDtcbiAgICBjdHgubGluZVdpZHRoID0gQW5nbGVDb25zdHJhaW50TGluZVdpZHRoO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IEFuZ2xlQ29uc3RyYWludFN0cm9rZUNvbG9yO1xuICAgIGN0eC5zdHJva2UoKTtcbiAgICBjdHgubGluZVdpZHRoID0gdG1wO1xufVxuXG5leHBvcnRzLkRpc3RhbmNlQ29uc3RyYWludCA9IERpc3RhbmNlQ29uc3RyYWludDtcbmV4cG9ydHMuUGluQ29uc3RyYWludCA9IFBpbkNvbnN0cmFpbnQ7XG5leHBvcnRzLkFuZ2xlQ29uc3RyYWludCA9IEFuZ2xlQ29uc3RyYWludDsiLCIvLyBleHBvcnRpbmcgYWxsIHRoZSBsaWJzIGhlcmUganVzdCBsaWtlIG5pbiBub2RlIGpzXG4vLyBjb29sIDpQXG5cbnZhciBQaHlTaGl0ID0gcmVxdWlyZSgnLi9waHlTaGl0Jyk7XG52YXIgY29uc3RyYWludCA9IHJlcXVpcmUoJy4vY29uc3RyYWludCcpO1xudmFyIG9iamVjdHMgPSByZXF1aXJlKCcuL29iamVjdHMnKTtcblxuLy8gYXBwbHlpbmcgdG8gZ2xvYmFsIHdpbmRvdyBvYmplY3RcbndpbmRvdy5WZWMyID0gcmVxdWlyZSgnLi92ZWMyJyk7XG53aW5kb3cuUGh5U2hpdCA9IFBoeVNoaXQ7XG5cbndpbmRvdy5QYXJ0aWNsZSA9IFBoeVNoaXQuUGFydGljbGU7XG5cbndpbmRvdy5EaXN0YW5jZUNvbnN0cmFpbnQgPSBjb25zdHJhaW50LkRpc3RhbmNlQ29uc3RyYWludFxud2luZG93LlBpbkNvbnN0cmFpbnQgICAgICA9IGNvbnN0cmFpbnQuUGluQ29uc3RyYWludFxud2luZG93LkFuZ2xlQ29uc3RyYWludCAgICA9IGNvbnN0cmFpbnQuQW5nbGVDb25zdHJhaW50IiwiLy8gZ2VuZXJpYyBQaHlTaGl0IGVudGl0aWVzXG5cbnZhciBQaHlTaGl0ID0gcmVxdWlyZSgnLi9waHlTaGl0Jyk7XG52YXIgUGFydGljbGUgPSBQaHlTaGl0LlBhcnRpY2xlO1xudmFyIGNvbnN0cmFpbnRzID0gcmVxdWlyZSgnLi9jb25zdHJhaW50Jyk7XG52YXIgRGlzdGFuY2VDb25zdHJhaW50ID0gY29uc3RyYWludHMuRGlzdGFuY2VDb25zdHJhaW50O1xuXG4vLyBjcmVhdGluZyBwb2ludFxuUGh5U2hpdC5wcm90b3R5cGUucG9pbnQgPSBmdW5jdGlvbihwb3MpIHtcbiAgICB2YXIgY29tcG9zaXRlID0gbmV3IHRoaXMuQ29tcG9zaXRlKCk7XG4gICAgY29tcG9zaXRlLnBhcnRpY2xlcy5wdXNoKG5ldyBQYXJ0aWNsZShwb3MpKTtcbiAgICB0aGlzLmNvbXBvc2l0ZXMucHVzaChjb21wb3NpdGUpO1xuICAgIHJldHVybiBjb21wb3NpdGU7XG59XG5cbi8vIGNyZWF0aW5nIGxpbmUgc2VnbWVudFxuUGh5U2hpdC5wcm90b3R5cGUubGluZVNlZ21lbnRzID0gZnVuY3Rpb24odmVydGljZXMsIHN0aWZmbmVzcykge1xuICAgIHZhciBpO1xuICAgIHZhciBjb21wb3NpdGUgPSBuZXcgdGhpcy5Db21wb3NpdGUoKTtcblxuICAgIGZvcihpIGluIHZlcnRpY2VzKSB7XG4gICAgICAgIGNvbXBvc2l0ZS5wYXJ0aWNsZXMucHVzaChuZXcgUGFydGljbGUodmVydGljZXNbaV0pKTtcbiAgICAgICAgaWYoaSA+IDApIHtcbiAgICAgICAgICAgIGNvbXBvc2l0ZS5jb25zdHJhaW50cy5wdXNoKG5ldyBEaXN0YW5jZUNvbnN0cmFpbnQoY29tcG9zaXRlLnBhcnRpY2xlc1tpXSwgY29tcG9zaXRlLnBhcnRpY2xlc1tpLTFdLCBzdGlmZm5lc3MpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29tcG9zaXRlcy5wdXNoKGNvbXBvc2l0ZSk7XG4gICAgcmV0dXJuIGNvbXBvc2l0ZTtcbn1cblxuLy8gY3JlYXRpbmcgYSBzaGFwZXMsIGp1c3QgY2hhbmdlIHRoZSBubyBvZiBzZWdtZW50c1xuUGh5U2hpdC5wcm90b3R5cGUudGlyZSA9IGZ1bmN0aW9uKG9yaWdpbiwgcmFkaXVzLCBzZWdtZW50cywgc3Bva2VTdGlmZm5lc3MsIHRyZWFkU3RpZmZuZXNzKSB7XG4gICAgdmFyIHN0cmlkZSA9ICgyKk1hdGguUEkpIC9zZWdtZW50cztcbiAgICB2YXIgaTtcblxuICAgIHZhciBjb21wb3NpdGUgPSBuZXcgdGhpcy5Db21wb3NpdGUoKTtcblxuICAgIC8vIHBhcnRpY2xlc1xuICAgIGZvcih2YXIgaSA9IDAgOyBpIDwgc2VnbWVudHM7IGkrKykge1xuICAgICAgICB2YXIgdGhldGEgPSBpICogc3RyaWRlO1xuICAgICAgICBjb21wb3NpdGUucGFydGljbGVzLnB1c2gobmV3IFBhcnRpY2xlKG5ldyBWZWMyKG9yaWdpbi54ICsgTWF0aC5jb3ModGhldGEpICogcmFkaXVzLCBvcmlnaW4ueSArIE1hdGguc2luKHRoZXRhKSAqIHJhZGl1cykpKTtcbiAgICB9XG5cbiAgICB2YXIgY2VudGVyID0gbmV3IFBhcnRpY2xlKG9yaWdpbik7XG4gICAgY29tcG9zaXRlLnBhcnRpY2xlcy5wdXNoKGNlbnRlcik7XG5cbiAgICAvLyBjb25zdHJhaW50c1xuICAgIGZvcihpID0gMCA7aSA8IHNlZ21lbnRzOyBpKyspIHtcbiAgICAgICAgY29tcG9zaXRlLmNvbnN0cmFpbnRzLnB1c2gobmV3IERpc3RhbmNlQ29uc3RyYWludChjb21wb3NpdGUucGFydGljbGVzW2ldLCBjb21wb3NpdGUucGFydGljbGVzWyhpKzEpJXNlZ21lbnRzXSwgdHJlYWRTdGlmZm5lc3MpKTtcbiAgICAgICAgY29tcG9zaXRlLmNvbnN0cmFpbnRzLnB1c2gobmV3IERpc3RhbmNlQ29uc3RyYWludChjb21wb3NpdGUucGFydGljbGVzW2ldLCBjZW50ZXIsIHNwb2tlU3RpZmZuZXNzKSk7XG4gICAgICAgIGNvbXBvc2l0ZS5jb25zdHJhaW50cy5wdXNoKG5ldyBEaXN0YW5jZUNvbnN0cmFpbnQoY29tcG9zaXRlLnBhcnRpY2xlc1tpXSwgY29tcG9zaXRlLnBhcnRpY2xlc1soaSs1KSVzZWdtZW50c10sIHRyZWFkU3RpZmZuZXNzKSk7XG4gICAgfVxuXG4gICAgdGhpcy5jb21wb3NpdGVzLnB1c2goY29tcG9zaXRlKTtcbiAgICByZXR1cm4gY29tcG9zaXRlO1xufSIsIi8qXG4qICBhdXRob3IgOiBhYmhpc2hlayBnb3N3YW1pICggaGlybyApXG4qICBhYmhpc2hla2c3ODVAZ21haWwuY29tXG4qXG4qICBwaHlTaGl0LmpzXG4gKi9cblxud2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbnx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbnx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbnx8IHdpbmRvdy5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lXG58fCB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbnx8IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xufVxuXG4vLyByZXF1aXJlIDJkIGltcGxlbWVudGF0aW9uIG9mIDJkIHZlY3RvclxudmFyIFZlYzIgPSByZXF1aXJlKCcuL3ZlYzInKTtcblxuLy8gZm9yIGV4cG9ydGluZyBtb2R1bGVzXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBQaHlTaGl0O1xuZXhwb3J0cy5QYXJ0aWNsZSA9IFBhcnRpY2xlO1xuZXhwb3J0cy5Db21wb3NpdGUgPSBDb21wb3NpdGU7XG5cbnZhciBHbG9iYWxWYXJpYWJsZXMgPSB7XG4gICAgJ3BhcnRpY2xlUmFkaXVzJyA6IDIsXG4gICAgJ3BhcnRpY2xlQ29sb3InIDogJyMyZGFkOGYnLFxuICAgICdoaWdobGlnaHRlZFBhcnRpY2xlUmFkaXVzJyA6IDgsXG59XG5cbi8vIGNyZWF0ZWQgYSBuZXcgcGFydGljbGVcbmZ1bmN0aW9uIFBhcnRpY2xlKHBvcykge1xuICAgIHRoaXMucG9zID0gKG5ldyBWZWMyKCkpLm11dGFibGVTZXQocG9zKTtcbiAgICB0aGlzLmxhc3RQb3MgPSAobmV3IFZlYzIoKSkubXV0YWJsZVNldChwb3MpO1xufVxuXG4vLyBkcmF3IGEgcGFydGljbGUgb24gdGhlIGNhbnZhc1xuUGFydGljbGUucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjdHgpIHtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4LmFyYyh0aGlzLnBvcy54LCB0aGlzLnBvcy55LCBHbG9iYWxWYXJpYWJsZXMucGFydGljbGVSYWRpdXMsIDAsIDIqTWF0aC5QSSk7XG4gICAgY3R4LmZpbGxTdHlsZSA9IEdsb2JhbFZhcmlhYmxlcy5wYXJ0aWNsZUNvbG9yO1xuICAgIGN0eC5maWxsKCk7XG59XG5cbi8vIG1haW4gY2xhc3NcbmZ1bmN0aW9uIFBoeVNoaXQod2lkdGgsIGhlaWdodCwgY2FudmFzKSB7XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xuICAgIHRoaXMuY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5tb3VzZSA9IG5ldyBWZWMyKDAsMCk7XG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLmRyYWdnZWRFbnRpdHkgPSBudWxsO1xuICAgIHRoaXMuc2VsZWN0aW9uUmFkaXVzID0gMjA7XG4gICAgdGhpcy5oaWdobGlnaHRDb2xvciA9IFwiIzRmNTQ1Y1wiO1xuXG4gICAgdGhpcy5ib3VuZHMgPSBmdW5jdGlvbihwYXJ0aWNsZSkge1xuXG4gICAgICAgIGlmKHBhcnRpY2xlLnBvcy55ID4gdGhpcy5oZWlnaHQgLSAxKSB7XG4gICAgICAgICAgICBwYXJ0aWNsZS5wb3MueSA9IHRoaXMuaGVpZ2h0IC0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHBhcnRpY2xlLnBvcy54IDwgMCkge1xuICAgICAgICAgICAgcGFydGljbGUucG9zLnggPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYocGFydGljbGUucG9zLnggPiB0aGlzLndpZHRoIC0gMSkge1xuICAgICAgICAgICAgcGFydGljbGUucG9zLnggPSB0aGlzLndpZHRoIC0gMTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIHByZXZlbnRzIGNvbnRleHQgbWVudVxuICAgIHRoaXMuY2FudmFzLm9uY29udGV4dG1lbnUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICB0aGlzLmNhbnZhcy5vbm1vdXNlZG93biA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgX3RoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgdmFyIG5lYXJlc3QgPSBfdGhpcy5uZWFyZXN0RW50aXR5KCk7XG4gICAgICAgIGlmKG5lYXJlc3QpIHtcbiAgICAgICAgICAgIF90aGlzLmRyYWdnZWRFbnRpdHkgPSBuZWFyZXN0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jYW52YXMub25tb3VzZXVwID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBfdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgX3RoaXMuZHJhZ2dlZEVudGl0eSA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gZ2V0Qm91bmRpbmdDbGllbnRSZWN0IHJldHVybnMgdGhlIHNpemUgb2YgYW4gZWxlbWVudCBhbmQgaXRzXG4gICAgLy8gcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0XG4gICAgLy8gdGhpcyBmdW5jdGlvbiBzZXRzIHRoZSBtb3VzZSBwb3NpdGlvbiB3LnIgdG8gdGhlIGNhbnZhc1xuICAgIHRoaXMuY2FudmFzLm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgcmVjdCA9IF90aGlzLmNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgX3RoaXMubW91c2UueCA9IGUuY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICAgICAgX3RoaXMubW91c2UueSA9IGUuY2xpZW50WSAtIHJlY3QudG9wO1xuICAgIH1cblxuICAgIC8vIHBhcmFtZXRlcnMgZm9yIHNpbXVsYXRpb25cbiAgICB0aGlzLmdyYXZpdHkgPSBuZXcgVmVjMigwLCAwLjIpO1xuICAgIHRoaXMuZnJpY3Rpb24gPSAwLjk5O1xuICAgIHRoaXMuZ3JvdW5kRnJpY3Rpb24gPSAwLjg7XG5cbiAgICAvLyBob2xkcyBjb21wb3NpdGUgZW50aXRpZXNcbiAgICB0aGlzLmNvbXBvc2l0ZXMgPSBbXTsgICAvLyBvYmplY3Qgb2YgdGhlIGNvbXBvc2l0ZSBjbGFzc1xuXG59XG5cblBoeVNoaXQucHJvdG90eXBlLkNvbXBvc2l0ZSA9IENvbXBvc2l0ZTtcblxuZnVuY3Rpb24gQ29tcG9zaXRlKCkge1xuICAgIHRoaXMucGFydGljbGVzID0gW107ICAgLy8gY29udGFpbnMgdGhlIHBhcnRpY2xlcyB0byBwbGF5IHdpdGggOlBcbiAgICB0aGlzLmNvbnN0cmFpbnRzID0gW107ICAvLyBjb250YWlucyB0aGUgY29uc3RyYWlucyBhcHBsaWVkIG9uIHRoZW1cblxuICAgIHRoaXMuZHJhd1BhcnRpY2xlcyA9IG51bGw7XG4gICAgdGhpcy5kcmF3Q29uc3RyYWludHMgPSBudWxsO1xufVxuXG5Db21wb3NpdGUucHJvdG90eXBlLnBpbiA9IGZ1bmN0aW9uKGluZGV4LCBwb3MpIHtcbiAgICBwb3MgPSBwb3MgfHwgdGhpcy5wYXJ0aWNsZXNbaW5kZXhdLnBvcztcbiAgICB2YXIgcGMgPSBuZXcgUGluQ29uc3RyYWludCh0aGlzLnBhcnRpY2xlc1tpbmRleF0sIHBvcyk7XG4gICAgdGhpcy5jb25zdHJhaW50cy5wdXNoKHBjKTtcbiAgICByZXR1cm4gcGM7XG59XG5cblBoeVNoaXQucHJvdG90eXBlLmZyYW1lID0gZnVuY3Rpb24oc3RlcCkge1xuICAgIHZhciBpLCBqICxjO1xuXG4gICAgZm9yKGMgaW4gdGhpcy5jb21wb3NpdGVzKSB7XG4gICAgICAgIGZvcihpIGluIHRoaXMuY29tcG9zaXRlc1tjXS5wYXJ0aWNsZXMpIHtcbiAgICAgICAgICAgIHZhciBwYXJ0aWNsZXMgPSB0aGlzLmNvbXBvc2l0ZXNbY10ucGFydGljbGVzO1xuXG4gICAgICAgICAgICAvLyBjYWxjdWxhdGUgdmVsb2NpdHlcbiAgICAgICAgICAgIHZhciB2ZWxvY2l0eSA9IHBhcnRpY2xlc1tpXS5wb3Muc3ViKHBhcnRpY2xlc1tpXS5sYXN0UG9zKS5zY2FsZSh0aGlzLmZyaWN0aW9uKTtcblxuICAgICAgICAgICAgLy8gZ3JvdW5kIGZyaWN0aW9uXG4gICAgICAgICAgICBpZihwYXJ0aWNsZXNbaV0ucG9zLnkgPj0gdGhpcy5oZWlnaHQgLSAxICYmIHZlbG9jaXR5Lmxlbmd0aDIoKSA+IDAuMDAwMDAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIG0gPSB2ZWxvY2l0eS5sZW5ndGgoKTtcbiAgICAgICAgICAgICAgICB2ZWxvY2l0eS54IC89IG07XG4gICAgICAgICAgICAgICAgdmVsb2NpdHkueSAvPSBtO1xuICAgICAgICAgICAgICAgIHZlbG9jaXR5Lm11dGFibGVTY2FsZShtICogdGhpcy5ncm91bmRGcmljdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNhdmUgbGFzdCBnb29kIHN0YXRlXG4gICAgICAgICAgICBwYXJ0aWNsZXNbaV0ubGFzdFBvcy5tdXRhYmxlU2V0KHBhcnRpY2xlc1tpXS5wb3MpO1xuXG4gICAgICAgICAgICAvLyBhZGRpbmcgZ3Jhdml0eVxuICAgICAgICAgICAgcGFydGljbGVzW2ldLnBvcy5tdXRhYmxlQWRkKHRoaXMuZ3Jhdml0eSk7XG5cbiAgICAgICAgICAgIC8vIGFkZGluZyBpbmVydGlhXG4gICAgICAgICAgICBwYXJ0aWNsZXNbaV0ucG9zLm11dGFibGVBZGQodmVsb2NpdHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gaGFuZGxlIGRyYWdnaW5nIG9mIGVudGl0aWVzXG4gICAgaWYodGhpcy5kcmFnZ2VkRW50aXR5KSB7XG4gICAgICAgIHRoaXMuZHJhZ2dlZEVudGl0eS5wb3MubXV0YWJsZVNldCh0aGlzLm1vdXNlKTtcbiAgICB9XG5cbiAgICAvL3JlbGF4XG4gICAgdmFyIHN0ZXBDb2VmID0gMSAvIHN0ZXA7XG4gICAgZm9yKGMgaW4gdGhpcy5jb21wb3NpdGVzKSB7XG4gICAgICAgIHZhciBjb25zdHJhaW50cyA9IHRoaXMuY29tcG9zaXRlc1tjXS5jb25zdHJhaW50cztcbiAgICAgICAgZm9yKHZhciBpID0gMCA7IGkgPCBzdGVwOyBpKyspIHtcbiAgICAgICAgICAgIGZvciggaiBpbiBjb25zdHJhaW50cykge1xuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzW2pdLnJlbGF4KHN0ZXBDb2VmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGJvdW5kIGNoZWNraW5nXG4gICAgZm9yKGMgaW4gdGhpcy5jb21wb3NpdGVzKSB7XG4gICAgICAgIHZhciBwYXJ0aWNsZXMgPSB0aGlzLmNvbXBvc2l0ZXNbY10ucGFydGljbGVzO1xuICAgICAgICBmb3IoaSBpbiBwYXJ0aWNsZXMpIHtcbiAgICAgICAgICAgIHRoaXMuYm91bmRzKHBhcnRpY2xlc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cblBoeVNoaXQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaSxjO1xuXG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuXG4gICAgZm9yKGMgaW4gdGhpcy5jb21wb3NpdGVzKSB7XG4gICAgICAgIC8vIGRyYXcgY29uc3RyYWludHNcbiAgICAgICAgaWYodGhpcy5jb21wb3NpdGVzW2NdLmRyYXdDb25zdHJhaW50cykge1xuICAgICAgICAgICAgdGhpcy5jb21wb3NpdGVzW2NdLmRyYXdDb25zdHJhaW50cyh0aGlzLmN0eCwgdGhpcy5jb21wb3NpdGVzW2NdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgdmFyIGNvbnN0cmFpbnRzID0gdGhpcy5jb21wb3NpdGVzW2NdLmNvbnN0cmFpbnRzO1xuICAgICAgICAgICAgZm9yKGkgaW4gY29uc3RyYWludHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50c1tpXS5kcmF3KHRoaXMuY3R4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGRyYXcgcGFydGljbGVzXG4gICAgaWYodGhpcy5jb21wb3NpdGVzW2NdLmRyYXdQYXJ0aWNsZXMpIHtcbiAgICAgICAgdGhpcy5jb21wb3NpdGVzW2NdLmRyYXdQYXJ0aWNsZXModGhpcy5jdHgsIHRoaXMuY29tcG9zaXRlc1tjXSk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAgIHZhciBwYXJ0aWNsZXMgPSB0aGlzLmNvbXBvc2l0ZXNbY10ucGFydGljbGVzO1xuICAgICAgICBmb3IoaSBpbiBwYXJ0aWNsZXMpIHtcbiAgICAgICAgICAgIHBhcnRpY2xlc1tpXS5kcmF3KHRoaXMuY3R4KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGhpZ2hsaWdodCBuZWFyZXN0IC8gZHJhZ2dlZCBlbnRpdHlcbiAgICB2YXIgbmVhcmVzdCA9IHRoaXMuZHJhZ2dlZEVudGl0eSB8fCB0aGlzLm5lYXJlc3RFbnRpdHkoKTtcbiAgICBpZihuZWFyZXN0KSB7XG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5hcmMobmVhcmVzdC5wb3MueCwgbmVhcmVzdC5wb3MueSwgR2xvYmFsVmFyaWFibGVzLmhpZ2hsaWdodGVkUGFydGljbGVSYWRpdXMsIDAsIDIgKiBNYXRoLlBJKTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmhpZ2hsaWdodENvbG9yO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICB9XG59XG5cblBoeVNoaXQucHJvdG90eXBlLm5lYXJlc3RFbnRpdHkgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYywgaTtcbiAgICB2YXIgZDJOZWFyZXN0ID0gMDtcbiAgICB2YXIgZW50aXR5ID0gbnVsbDtcbiAgICB2YXIgY29uc3RyYWludE5lYXJlc3QgPSBudWxsO1xuXG4gICAgLy8gZmluZCBuZWFyZXN0IHBvaW50XG4gICAgZm9yKGMgaW4gdGhpcy5jb21wb3NpdGVzKSB7XG4gICAgICAgIHZhciBwYXJ0aWNsZXMgPSB0aGlzLmNvbXBvc2l0ZXNbY10ucGFydGljbGVzO1xuICAgICAgICBmb3IoaSBpbiBwYXJ0aWNsZXMpIHtcbiAgICAgICAgICAgIHZhciBkMiA9IHBhcnRpY2xlc1tpXS5wb3MuZGlzdDIodGhpcy5tb3VzZSk7XG4gICAgICAgICAgICBpZihkMiA8PSB0aGlzLnNlbGVjdGlvblJhZGl1cyAqIHRoaXMuc2VsZWN0aW9uUmFkaXVzICYmIChlbnRpdHkgPT0gbnVsbCB8fCBkMiA8IGQyTmVhcmVzdCkpIHtcbiAgICAgICAgICAgICAgICBlbnRpdHkgPSBwYXJ0aWNsZXNbaV07XG4gICAgICAgICAgICAgICAgY29uc3RyYWludE5lYXJlc3QgPSB0aGlzLmNvbXBvc2l0ZXNbY10uY29uc3RyYWludHM7XG4gICAgICAgICAgICAgICAgZDJOZWFyZXN0ID0gZDI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzZWFyY2ggZm9yIHBpbm5lZCBjb25zdHJhaW50IGZvciB0aGlzIGVudGl0eVxuICAgIGZvcihpIGluIGNvbnN0cmFpbnROZWFyZXN0KSB7XG4gICAgICAgIGlmKGNvbnN0cmFpbnROZWFyZXN0W2ldIGluc3RhbmNlb2YgUGluQ29uc3RyYWludCAmJiBjb25zdHJhaW50TmVhcmVzdFtpXS5hID09IGVudGl0eSkge1xuICAgICAgICAgICAgZW50aXR5ID0gY29uc3RyYWludE5lYXJlc3RbaV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZW50aXR5O1xufVxuIiwiLypcbiogIGF1dGhvciA6IGFiaGlzaGVrIGdvc3dhbWkgKCBoaXJvIClcbiogIGFiaGlzaGVrZzc4NUBnbWFpbC5jb21cbipcbiogICB2ZWMyLmpzIDogYSBzaW1wbGUgMi1EIHZlY3RvciBpbXBsZW1lbnRhdGlvblxuKi9cblxuLypcbiBDb3B5cmlnaHQgMjAxMyBTdWIgUHJvdG9jb2wgYW5kIG90aGVyIGNvbnRyaWJ1dG9yc1xuIGh0dHA6Ly9zdWJwcm90b2NvbC5jb20vXG5cbiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmdcbiBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbiBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbiB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvXG4gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG4gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkRcbiBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFXG4gTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTlxuIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cbmZ1bmN0aW9uIFZlYzIoeCwgeSkge1xuICAgIHRoaXMueCA9IHggfHwgMDtcbiAgICB0aGlzLnkgPSB5IHx8IDA7XG59XG5cblZlYzIucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gbmV3IFZlYzIodGhpcy54ICsgdi54LCB0aGlzLnkgKyB2LnkpO1xufVxuXG5WZWMyLnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMueCAtIHYueCwgdGhpcy55IC0gdi55KTtcbn1cblxuVmVjMi5wcm90b3R5cGUubXVsID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggKiB2LngsIHRoaXMueSAqIHYueSk7XG59XG5cblZlYzIucHJvdG90eXBlLmRpdiA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gbmV3IFZlYzIodGhpcy54IC8gdi54LCB0aGlzLnkgLyB2LnkpXG59XG5cblZlYzIucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oZmFjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMueCAqIGZhY3RvciwgdGhpcy55ICogZmFjdG9yKTtcbn1cblxuVmVjMi5wcm90b3R5cGUubXV0YWJsZVNldCA9IGZ1bmN0aW9uKHYpIHtcbiAgICB0aGlzLnggPSB2Lng7XG4gICAgdGhpcy55ID0gdi55O1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5WZWMyLnByb3RvdHlwZS5tdXRhYmxlQWRkID0gZnVuY3Rpb24odikge1xuICAgIHRoaXMueCArPSB2Lng7XG4gICAgdGhpcy55ICs9IHYueTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVmVjMi5wcm90b3R5cGUubXV0YWJsZVN1YiA9IGZ1bmN0aW9uKHYpIHtcbiAgICB0aGlzLnggLT0gdi54O1xuICAgIHRoaXMueSAtPSB2Lnk7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblZlYzIucHJvdG90eXBlLm11dGFibGVNdWwgPSBmdW5jdGlvbih2KSB7XG4gICAgdGhpcy54ICo9IHYueDtcbiAgICB0aGlzLnkgKj0gdi55O1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5WZWMyLnByb3RvdHlwZS5tdXRhYmxlRGl2ID0gZnVuY3Rpb24odikge1xuICAgIHRoaXMueCAvPSB2Lng7XG4gICAgdGhpcy55IC89IHYueTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVmVjMi5wcm90b3R5cGUubXV0YWJsZVNjYWxlID0gZnVuY3Rpb24oZmFjdG9yKSB7XG4gICAgdGhpcy54ICo9IGZhY3RvcjtcbiAgICB0aGlzLnkgKj0gZmFjdG9yO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5WZWMyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIHRoaXMueCA9PSB2LnggJiYgdGhpcy55ID09IHYueTtcbn1cblxuVmVjMi5wcm90b3R5cGUuZXBzaWxvbkVxdWFscyA9IGZ1bmN0aW9uKHYsIGVwc2lsb24pIHtcbiAgICByZXR1cm4gTWF0aC5hYnModGhpcy54IC0gdi54KSA8PSBlcHNpbG9uICYmIE1hdGguYWJzKHRoaXMueSAtIHYueSkgPD0gZXBzaWxvbjtcbn1cblxuLy8gbGVzcyBlZmZpY2llbnQgc2luY2UgdGhlIHVzZSBvZiB0aGUgTWF0aC5zcXJ0IGZ1bmN0aW9uXG5WZWMyLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkpO1xufVxuXG4vLyBtb3JlIGVmZmljaWVudCB0aGFuIHRoZSBhYm92ZVxuVmVjMi5wcm90b3R5cGUubGVuZ3RoMiA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55O1xufVxuXG5WZWMyLnByb3RvdHlwZS5kaXN0ID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5kaXN0Mih2KSk7XG59XG5cblZlYzIucHJvdG90eXBlLmRpc3QyID0gZnVuY3Rpb24odikge1xuICAgIHZhciB4ID0gdi54IC0gdGhpcy54O1xuICAgIHZhciB5ID0gdi55IC0gdGhpcy55O1xuICAgIHJldHVybiB4KnggKyB5Knk7XG59XG5cblZlYzIucHJvdG90eXBlLm5vcm1hbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtID0gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSk7XG4gICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMueC9tLCB0aGlzLnkvbSk7XG59XG5cblZlYzIucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55O1xufVxuXG5WZWMyLnByb3RvdHlwZS5hbmdsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gTWF0aC5hdGFuMih0aGlzLnggKiB2LnkgLSB0aGlzLnkgKiB2LngsIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueSk7XG59XG5cblZlYzIucHJvdG90eXBlLmFuZ2xlMiA9IGZ1bmN0aW9uKHZMZWZ0LCB2UmlnaHQpIHtcbiAgICByZXR1cm4gdkxlZnQuc3ViKHRoaXMpLmFuZ2xlKHZSaWdodC5zdWIodGhpcykpO1xufVxuXG4vKlxuICAgIHJvdGF0aW9uIG9mIGEgdmVjdG9yIHRocm91Z2ggYW4gYW5nbGUgdGhldGEgYW5kIHNoaWZ0IGluIHRoZSBvcmlnaW5cbiAgICB4ID0gciBjb3MoaW5pdGlhbF9hbmdsZSlcbiAgICB5ID0gciBzaW4oaW5pdGlhbF9hbmdsZSlcbiAgICBub3cgcm90YXRpb24gdGhyb3VnaCBhbmQgYW5nbGUgb2YgdGhldGFcbiAgICB4JyA9IHIgY29zKGluaXRpYWxfYW5nbGUgKyB0aGV0YSlcbiAgICB5JyA9IHIgY29zKGluaXRpYWxfYW5nbGUgKyB0aGV0YSlcbiAgICBzbyA9PiB4JyA9IHggY29zKHRoZXRhKSAtIHkgc2luKHRoZXRhKVxuICAgICAgICAgIHknID0geSBjb3ModGhldGEpICsgeCBzaW4odGhldGEpXG4gKi9cblZlYzIucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uKG9yaWdpbiwgdGhldGEpIHtcbiAgICB2YXIgeCA9IHRoaXMueCAtIG9yaWdpbi54O1xuICAgIHZhciB5ID0gdGhpcy55IC0gb3JpZ2luLnk7XG4gICAgcmV0dXJuIG5ldyBWZWMyKHggKiBNYXRoLmNvcyh0aGV0YSkgLSB5ICogTWF0aC5zaW4odGhldGEpICsgb3JpZ2luLngsIHggKiBNYXRoLnNpbih0aGV0YSkgKyB5ICogTWF0aC5jb3ModGhldGEpICsgb3JpZ2luLnkgKTtcbn1cblxuXG5WZWMyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcIihcIiArIHRoaXMueCArIFwiLCBcIiArIHRoaXMueSArIFwiKVwiO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZlYzI7Il19
