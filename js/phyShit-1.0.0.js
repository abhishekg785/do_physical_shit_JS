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
},{}],2:[function(require,module,exports){
// exporting all the libs here just like nin node js
// cool :P

var PhyShit = require('./phyShit');
var constraint = require('./constraint');

// applying to global window object
window.Vec2 = require('./vec2');
window.PhyShit = PhyShit;

window.Particle = PhyShit.Particle;

window.DistanceConstraint = constraint.DistanceConstraint
window.PinConstraint      = constraint.PinConstraint
window.AngleConstraint    = constraint.AngleConstraint
},{"./constraint":1,"./phyShit":3,"./vec2":4}],3:[function(require,module,exports){
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

},{"./vec2":4}],4:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY29uc3RyYWludC5qcyIsImxpYi9pbnRlZy5qcyIsImxpYi9waHlTaGl0LmpzIiwibGliL3ZlYzIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qXG4qICBhdXRob3IgOiBhYmhpc2hlayBnb3N3YW1pICggSGlybyApXG4qICBhYmhpc2hla2c3ODVAZ21haWwuY29tXG4qXG4qICBjb25zdHJhaW50LmpzIDogYWRkaW5nIHRoZSBjb25zdHJhaW50IG9uIHRoZSBwYXJ0aWNsZXNcbiAqL1xuXG4vLyBEaXN0YW5jZUNvbnN0cmFpbnQgLS0gY29uc3RyYWludHMgdG8gdGhlIGluaXRpYWwgZGlzdGFuY2Vcbi8vIFBpbkNvbnN0cmFpbnQgLS0gY29uc3RyYWlucyB0byBzdGF0aWMvZml4ZWQgcG9pbnRzXG4vLyBBbmdsZUNvbnN0cmFpbnRzIC0tIGNvbnRhaW5zIDMgcGFydGljbGVzIHRvIGFuIGFuZ2xlXG5cbnZhciBsaW5lU3Ryb2tlQ29sb3IgPSAnZDhkZGUyJyxcbiAgICBQaW5Db25zdHJhaW50UmFkaXVzID0gNixcbiAgICBQaW5Db25zdHJhaW50RmlsbENvbG9yID0gJ3JnYmEoMCwxNTMsMjU1LDAuMSknLFxuXG4gICAgQW5nbGVDb25zdHJhaW50U3Ryb2tlQ29sb3IgPSAncmdiYSgyNTUsMjU1LDAsMC4yKScsXG4gICAgQW5nbGVDb25zdHJhaW50TGluZVdpZHRoID0gNTtcblxuXG4vLyBjbGFzcyBEaXN0YW5jZUNvbnN0cmFpbnQgYXMgYSBjb25zdHJ1Y3RvclxuZnVuY3Rpb24gRGlzdGFuY2VDb25zdHJhaW50KGEsIGIsIHN0aWZmbmVzcywgZGlzdGFuY2UpIHtcbiAgICB0aGlzLmEgPSBhO1xuICAgIHRoaXMuYiA9IGI7XG4gICAgdGhpcy5kaXN0YW5jZSA9IHR5cGVvZiBkaXN0YW5jZSAhPSBcInVuZGVmaW5lZFwiID8gZGlzdGFuY2UgOiBhLnBvcy5zdWIoYi5wb3MpLmxlbmd0aCgpO1xuICAgIHRoaXMuc3RpZmZuZXNzID0gc3RpZmZuZXNzO1xufVxuXG5EaXN0YW5jZUNvbnN0cmFpbnQucHJvdG90eXBlLnJlbGF4ID0gZnVuY3Rpb24oc3RlcENvZWYpIHtcbiAgICB2YXIgbm9ybWFsID0gdGhpcy5hLnBvcy5zdWIodGhpcy5iLnBvcyk7XG4gICAgdmFyIG0gPSBub3JtYWwubGVuZ3RoMigpO1xuICAgIG5vcm1hbC5tdXRhYmxlU2NhbGUoKCh0aGlzLmRpc3RhbmNlKnRoaXMuZGlzdGFuY2UgLSBtKS9tKSp0aGlzLnN0aWZmbmVzcypzdGVwQ29lZik7XG4gICAgdGhpcy5hLnBvcy5tdXRhYmxlQWRkKG5vcm1hbCk7XG4gICAgdGhpcy5iLnBvcy5tdXRhYmxlU3ViKG5vcm1hbCk7XG59XG5cbkRpc3RhbmNlQ29uc3RyYWludC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGN0eCkge1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgubW92ZVRvKHRoaXMuYS5wb3MueCwgdGhpcy5hLnBvcy55KTtcbiAgICBjdHgubGluZVRvKHRoaXMuYi5wb3MueCwgdGhpcy5iLnBvcy55KTtcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBsaW5lU3Ryb2tlQ29sb3I7XG4gICAgY3R4LnN0cm9rZSgpO1xufVxuXG5cbi8vIGZ1bmN0aW9ucyBmb3IgcGluIGNvbnN0cmFpbnQgc3RhcnRzIGhlcmVcblxuLy8gUGluQ29uc3RyYWludHMgY29ucyBoYXZpbmcgcGFyYW1zOlxuLy8gYSA6IHRoZSBwb2ludCB0byB3b3JrIG9uXG4vLyBwb3MgOiBwb3NpdGlvbiB3aGVyZSB0byBzZXQgdGhlIHBvaW50IG9uIHRoZSBjYW52YXNcbmZ1bmN0aW9uIFBpbkNvbnN0cmFpbnQoYSwgcG9zKSB7XG4gICAgdGhpcy5hID0gYTtcbiAgICB0aGlzLnBvcyA9IChuZXcgVmVjMigpKS5tdXRhYmxlU2V0KHBvcyk7XG59XG5cblBpbkNvbnN0cmFpbnQucHJvdG90eXBlLnJlbGF4ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5hLnBvcy5tdXRhYmxlU2V0KHRoaXMucG9zKTtcbn1cblxuUGluQ29uc3RyYWludC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGN0eCkge1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHguYXJjKHRoaXMucG9zLngsIHRoaXMucG9zLnksIFBpbkNvbnN0cmFpbnRSYWRpdXMsIDAsIDIqTWF0aC5QSSk7XG4gICAgY3R4LmZpbGxTdHlsZSA9IFBpbkNvbnN0cmFpbnRGaWxsQ29sb3I7XG4gICAgY3R4LmZpbGwoKTtcbn1cblxuXG4vLyBmdW5jdGlvbnMgZm9yIHRoZSBBbmdsZUNvbnN0cmFpbnRcbmZ1bmN0aW9uIEFuZ2xlQ29uc3RyYWludChhLCBiLCBjLCBzdGlmZm5lc3MpIHtcbiAgICB0aGlzLmEgPSBhO1xuICAgIHRoaXMuYiA9IGI7XG4gICAgdGhpcy5jID0gYztcbiAgICB0aGlzLmFuZ2xlID0gdGhpcy5iLnBvcy5hbmdsZTIodGhpcy5hLnBvcywgdGhpcy5jLnBvcyk7XG4gICAgdGhpcy5zdGlmZm5lc3MgPSBzdGlmZm5lc3M7XG59XG5cbkFuZ2xlQ29uc3RyYWludC5wcm90b3R5cGUucmVsYXggPSBmdW5jdGlvbihzdGVwQ29lZikge1xuICAgIHZhciBhbmdsZSA9IHRoaXMuYi5wb3MuYW5nbGUyKHRoaXMuYS5wb3MsIHRoaXMuYy5wb3MpO1xuICAgIHZhciBkaWZmID0gYW5nbGUgPSB0aGlzLmFuZ2xlO1xuXG4gICAgaWYoZGlmZiA8PSAtTWF0aC5QSSkge1xuICAgICAgICBkaWZmICs9IDIqTWF0aC5QSTtcbiAgICB9XG4gICAgZWxzZSBpZihkaWZmID49IE1hdGguUEkpIHtcbiAgICAgICAgZGlmZiAtPSAyKk1hdGguUEk7XG4gICAgfVxuXG4gICAgZGlmZiAqPSBzdGVwQ29lZip0aGlzLnN0aWZmbmVzcztcblxuICAgIHRoaXMuYS5wb3MgPSB0aGlzLmEucG9zLnJvdGF0ZSh0aGlzLmIucG9zLCBkaWZmKTtcbiAgICB0aGlzLmMucG9zID0gdGhpcy5jLnBvcy5yb3RhdGUodGhpcy5iLnBvcywgLWRpZmYpO1xuICAgIHRoaXMuYi5wb3MgPSB0aGlzLmIucG9zLnJvdGF0ZSh0aGlzLmEucG9zLCBkaWZmKTtcbiAgICB0aGlzLmIucG9zID0gdGhpcy5iLnBvcy5yb3RhdGUodGhpcy5jLnBvcywgLWRpZmYpO1xufVxuXG5BbmdsZUNvbnN0cmFpbnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjdHgpIHtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4Lm1vdmVUbyh0aGlzLmEucG9zLngsIHRoaXMuYS5wb3MueSk7XG4gICAgY3R4LmxpbmVUbyh0aGlzLmIucG9zLngsIHRoaXMuYi5wb3MueSk7XG4gICAgY3R4LmxpbmVUbyh0aGlzLmMucG9zLngsIHRoaXMuYy5wb3MueSk7XG4gICAgdmFyIHRtcCA9IGN0eC5saW5lV2lkdGg7XG4gICAgY3R4LmxpbmVXaWR0aCA9IEFuZ2xlQ29uc3RyYWludExpbmVXaWR0aDtcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBBbmdsZUNvbnN0cmFpbnRTdHJva2VDb2xvcjtcbiAgICBjdHguc3Ryb2tlKCk7XG4gICAgY3R4LmxpbmVXaWR0aCA9IHRtcDtcbn0iLCIvLyBleHBvcnRpbmcgYWxsIHRoZSBsaWJzIGhlcmUganVzdCBsaWtlIG5pbiBub2RlIGpzXG4vLyBjb29sIDpQXG5cbnZhciBQaHlTaGl0ID0gcmVxdWlyZSgnLi9waHlTaGl0Jyk7XG52YXIgY29uc3RyYWludCA9IHJlcXVpcmUoJy4vY29uc3RyYWludCcpO1xuXG4vLyBhcHBseWluZyB0byBnbG9iYWwgd2luZG93IG9iamVjdFxud2luZG93LlZlYzIgPSByZXF1aXJlKCcuL3ZlYzInKTtcbndpbmRvdy5QaHlTaGl0ID0gUGh5U2hpdDtcblxud2luZG93LlBhcnRpY2xlID0gUGh5U2hpdC5QYXJ0aWNsZTtcblxud2luZG93LkRpc3RhbmNlQ29uc3RyYWludCA9IGNvbnN0cmFpbnQuRGlzdGFuY2VDb25zdHJhaW50XG53aW5kb3cuUGluQ29uc3RyYWludCAgICAgID0gY29uc3RyYWludC5QaW5Db25zdHJhaW50XG53aW5kb3cuQW5nbGVDb25zdHJhaW50ICAgID0gY29uc3RyYWludC5BbmdsZUNvbnN0cmFpbnQiLCIvKlxuKiAgYXV0aG9yIDogYWJoaXNoZWsgZ29zd2FtaSAoIGhpcm8gKVxuKiAgYWJoaXNoZWtnNzg1QGdtYWlsLmNvbVxuKlxuKiAgcGh5U2hpdC5qc1xuICovXG5cbndpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lXG58fCB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lXG58fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lXG58fCB3aW5kb3cub1JlcXVlc3RBbmltYXRpb25GcmFtZVxufHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lXG58fCBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB3aW5kb3cuc2V0VGltZW91dChjYWxsYmFjaywgMTAwMCAvIDYwKTtcbn1cblxuLy8gcmVxdWlyZSAyZCBpbXBsZW1lbnRhdGlvbiBvZiAyZCB2ZWN0b3JcbnZhciBWZWMyID0gcmVxdWlyZSgnLi92ZWMyJyk7XG5cbi8vIGZvciBleHBvcnRpbmcgbW9kdWxlc1xuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gUGh5U2hpdDtcbmV4cG9ydHMuUGFydGljbGUgPSBQYXJ0aWNsZTtcbmV4cG9ydHMuQ29tcG9zaXRlID0gQ29tcG9zaXRlO1xuXG52YXIgR2xvYmFsVmFyaWFibGVzID0ge1xuICAgICdwYXJ0aWNsZVJhZGl1cycgOiAyLFxuICAgICdwYXJ0aWNsZUNvbG9yJyA6ICcjMmRhZDhmJyxcbiAgICAnaGlnaGxpZ2h0ZWRQYXJ0aWNsZVJhZGl1cycgOiA4LFxufVxuXG4vLyBjcmVhdGVkIGEgbmV3IHBhcnRpY2xlXG5mdW5jdGlvbiBQYXJ0aWNsZShwb3MpIHtcbiAgICB0aGlzLnBvcyA9IChuZXcgVmVjMigpKS5tdXRhYmxlU2V0KHBvcyk7XG4gICAgdGhpcy5sYXN0UG9zID0gKG5ldyBWZWMyKCkpLm11dGFibGVTZXQocG9zKTtcbn1cblxuLy8gZHJhdyBhIHBhcnRpY2xlIG9uIHRoZSBjYW52YXNcblBhcnRpY2xlLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY3R4KSB7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5hcmModGhpcy5wb3MueCwgdGhpcy5wb3MueSwgR2xvYmFsVmFyaWFibGVzLnBhcnRpY2xlUmFkaXVzLCAwLCAyKk1hdGguUEkpO1xuICAgIGN0eC5maWxsU3R5bGUgPSBHbG9iYWxWYXJpYWJsZXMucGFydGljbGVDb2xvcjtcbiAgICBjdHguZmlsbCgpO1xufVxuXG4vLyBtYWluIGNsYXNzXG5mdW5jdGlvbiBQaHlTaGl0KHdpZHRoLCBoZWlnaHQsIGNhbnZhcykge1xuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcbiAgICB0aGlzLmN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMubW91c2UgPSBuZXcgVmVjMigwLDApO1xuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgdGhpcy5kcmFnZ2VkRW50aXR5ID0gbnVsbDtcbiAgICB0aGlzLnNlbGVjdGlvblJhZGl1cyA9IDIwO1xuICAgIHRoaXMuaGlnaGxpZ2h0Q29sb3IgPSBcIiM0ZjU0NWNcIjtcblxuICAgIHRoaXMuYm91bmRzID0gZnVuY3Rpb24ocGFydGljbGUpIHtcblxuICAgICAgICBpZihwYXJ0aWNsZS5wb3MueSA+IHRoaXMuaGVpZ2h0IC0gMSkge1xuICAgICAgICAgICAgcGFydGljbGUucG9zLnkgPSB0aGlzLmhlaWdodCAtIDE7XG4gICAgICAgIH1cblxuICAgICAgICBpZihwYXJ0aWNsZS5wb3MueCA8IDApIHtcbiAgICAgICAgICAgIHBhcnRpY2xlLnBvcy54ID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHBhcnRpY2xlLnBvcy54ID4gdGhpcy53aWR0aCAtIDEpIHtcbiAgICAgICAgICAgIHBhcnRpY2xlLnBvcy54ID0gdGhpcy53aWR0aCAtIDE7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAvLyBwcmV2ZW50cyBjb250ZXh0IG1lbnVcbiAgICB0aGlzLmNhbnZhcy5vbmNvbnRleHRtZW51ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgdGhpcy5jYW52YXMub25tb3VzZWRvd24gPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIF90aGlzLm1vdXNlRG93biA9IHRydWU7XG4gICAgICAgIHZhciBuZWFyZXN0ID0gX3RoaXMubmVhcmVzdEVudGl0eSgpO1xuICAgICAgICBpZihuZWFyZXN0KSB7XG4gICAgICAgICAgICBfdGhpcy5kcmFnZ2VkRW50aXR5ID0gbmVhcmVzdDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY2FudmFzLm9ubW91c2V1cCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgX3RoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgIF90aGlzLmRyYWdnZWRFbnRpdHkgPSBudWxsO1xuICAgIH1cblxuICAgIC8vIGdldEJvdW5kaW5nQ2xpZW50UmVjdCByZXR1cm5zIHRoZSBzaXplIG9mIGFuIGVsZW1lbnQgYW5kIGl0c1xuICAgIC8vIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydFxuICAgIC8vIHRoaXMgZnVuY3Rpb24gc2V0cyB0aGUgbW91c2UgcG9zaXRpb24gdy5yIHRvIHRoZSBjYW52YXNcbiAgICB0aGlzLmNhbnZhcy5vbm1vdXNlbW92ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIHJlY3QgPSBfdGhpcy5jYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIF90aGlzLm1vdXNlLnggPSBlLmNsaWVudFggLSByZWN0LmxlZnQ7XG4gICAgICAgIF90aGlzLm1vdXNlLnkgPSBlLmNsaWVudFkgLSByZWN0LnRvcDtcbiAgICB9XG5cbiAgICAvLyBwYXJhbWV0ZXJzIGZvciBzaW11bGF0aW9uXG4gICAgdGhpcy5ncmF2aXR5ID0gbmV3IFZlYzIoMCwgMC4yKTtcbiAgICB0aGlzLmZyaWN0aW9uID0gMC45OTtcbiAgICB0aGlzLmdyb3VuZEZyaWN0aW9uID0gMC44O1xuXG4gICAgLy8gaG9sZHMgY29tcG9zaXRlIGVudGl0aWVzXG4gICAgdGhpcy5jb21wb3NpdGVzID0gW107ICAgLy8gb2JqZWN0IG9mIHRoZSBjb21wb3NpdGUgY2xhc3NcblxufVxuXG5QaHlTaGl0LnByb3RvdHlwZS5Db21wb3NpdGUgPSBDb21wb3NpdGU7XG5cbmZ1bmN0aW9uIENvbXBvc2l0ZSgpIHtcbiAgICB0aGlzLnBhcnRpY2xlcyA9IFtdOyAgIC8vIGNvbnRhaW5zIHRoZSBwYXJ0aWNsZXMgdG8gcGxheSB3aXRoIDpQXG4gICAgdGhpcy5jb25zdHJhaW50cyA9IFtdOyAgLy8gY29udGFpbnMgdGhlIGNvbnN0cmFpbnMgYXBwbGllZCBvbiB0aGVtXG5cbiAgICB0aGlzLmRyYXdQYXJ0aWNsZXMgPSBudWxsO1xuICAgIHRoaXMuZHJhd0NvbnN0cmFpbnRzID0gbnVsbDtcbn1cblxuQ29tcG9zaXRlLnByb3RvdHlwZS5waW4gPSBmdW5jdGlvbihpbmRleCwgcG9zKSB7XG4gICAgcG9zID0gcG9zIHx8IHRoaXMucGFydGljbGVzW2luZGV4XS5wb3M7XG4gICAgdmFyIHBjID0gbmV3IFBpbkNvbnN0cmFpbnQodGhpcy5wYXJ0aWNsZXNbaW5kZXhdLCBwb3MpO1xuICAgIHRoaXMuY29uc3RyYWludHMucHVzaChwYyk7XG4gICAgcmV0dXJuIHBjO1xufVxuXG5QaHlTaGl0LnByb3RvdHlwZS5mcmFtZSA9IGZ1bmN0aW9uKHN0ZXApIHtcbiAgICB2YXIgaSwgaiAsYztcblxuICAgIGZvcihjIGluIHRoaXMuY29tcG9zaXRlcykge1xuICAgICAgICBmb3IoaSBpbiB0aGlzLmNvbXBvc2l0ZXNbY10ucGFydGljbGVzKSB7XG4gICAgICAgICAgICB2YXIgcGFydGljbGVzID0gdGhpcy5jb21wb3NpdGVzW2NdLnBhcnRpY2xlcztcblxuICAgICAgICAgICAgLy8gY2FsY3VsYXRlIHZlbG9jaXR5XG4gICAgICAgICAgICB2YXIgdmVsb2NpdHkgPSBwYXJ0aWNsZXNbaV0ucG9zLnN1YihwYXJ0aWNsZXNbaV0ubGFzdFBvcykuc2NhbGUodGhpcy5mcmljdGlvbik7XG5cbiAgICAgICAgICAgIC8vIGdyb3VuZCBmcmljdGlvblxuICAgICAgICAgICAgaWYocGFydGljbGVzW2ldLnBvcy55ID49IHRoaXMuaGVpZ2h0IC0gMSAmJiB2ZWxvY2l0eS5sZW5ndGgyKCkgPiAwLjAwMDAwMSkge1xuICAgICAgICAgICAgICAgIHZhciBtID0gdmVsb2NpdHkubGVuZ3RoKCk7XG4gICAgICAgICAgICAgICAgdmVsb2NpdHkueCAvPSBtO1xuICAgICAgICAgICAgICAgIHZlbG9jaXR5LnkgLz0gbTtcbiAgICAgICAgICAgICAgICB2ZWxvY2l0eS5tdXRhYmxlU2NhbGUobSAqIHRoaXMuZ3JvdW5kRnJpY3Rpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzYXZlIGxhc3QgZ29vZCBzdGF0ZVxuICAgICAgICAgICAgcGFydGljbGVzW2ldLmxhc3RQb3MubXV0YWJsZVNldChwYXJ0aWNsZXNbaV0ucG9zKTtcblxuICAgICAgICAgICAgLy8gYWRkaW5nIGdyYXZpdHlcbiAgICAgICAgICAgIHBhcnRpY2xlc1tpXS5wb3MubXV0YWJsZUFkZCh0aGlzLmdyYXZpdHkpO1xuXG4gICAgICAgICAgICAvLyBhZGRpbmcgaW5lcnRpYVxuICAgICAgICAgICAgcGFydGljbGVzW2ldLnBvcy5tdXRhYmxlQWRkKHZlbG9jaXR5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGhhbmRsZSBkcmFnZ2luZyBvZiBlbnRpdGllc1xuICAgIGlmKHRoaXMuZHJhZ2dlZEVudGl0eSkge1xuICAgICAgICB0aGlzLmRyYWdnZWRFbnRpdHkucG9zLm11dGFibGVTZXQodGhpcy5tb3VzZSk7XG4gICAgfVxuXG4gICAgLy9yZWxheFxuICAgIHZhciBzdGVwQ29lZiA9IDEgLyBzdGVwO1xuICAgIGZvcihjIGluIHRoaXMuY29tcG9zaXRlcykge1xuICAgICAgICB2YXIgY29uc3RyYWludHMgPSB0aGlzLmNvbXBvc2l0ZXNbY10uY29uc3RyYWludHM7XG4gICAgICAgIGZvcih2YXIgaSA9IDAgOyBpIDwgc3RlcDsgaSsrKSB7XG4gICAgICAgICAgICBmb3IoIGogaW4gY29uc3RyYWludHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50c1tqXS5yZWxheChzdGVwQ29lZik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBib3VuZCBjaGVja2luZ1xuICAgIGZvcihjIGluIHRoaXMuY29tcG9zaXRlcykge1xuICAgICAgICB2YXIgcGFydGljbGVzID0gdGhpcy5jb21wb3NpdGVzW2NdLnBhcnRpY2xlcztcbiAgICAgICAgZm9yKGkgaW4gcGFydGljbGVzKSB7XG4gICAgICAgICAgICB0aGlzLmJvdW5kcyhwYXJ0aWNsZXNbaV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5QaHlTaGl0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGksYztcblxuICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcblxuICAgIGZvcihjIGluIHRoaXMuY29tcG9zaXRlcykge1xuICAgICAgICAvLyBkcmF3IGNvbnN0cmFpbnRzXG4gICAgICAgIGlmKHRoaXMuY29tcG9zaXRlc1tjXS5kcmF3Q29uc3RyYWludHMpIHtcbiAgICAgICAgICAgIHRoaXMuY29tcG9zaXRlc1tjXS5kcmF3Q29uc3RyYWludHModGhpcy5jdHgsIHRoaXMuY29tcG9zaXRlc1tjXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIHZhciBjb25zdHJhaW50cyA9IHRoaXMuY29tcG9zaXRlc1tjXS5jb25zdHJhaW50cztcbiAgICAgICAgICAgIGZvcihpIGluIGNvbnN0cmFpbnRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3RyYWludHNbaV0uZHJhdyh0aGlzLmN0eCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkcmF3IHBhcnRpY2xlc1xuICAgIGlmKHRoaXMuY29tcG9zaXRlc1tjXS5kcmF3UGFydGljbGVzKSB7XG4gICAgICAgIHRoaXMuY29tcG9zaXRlc1tjXS5kcmF3UGFydGljbGVzKHRoaXMuY3R4LCB0aGlzLmNvbXBvc2l0ZXNbY10pO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgICB2YXIgcGFydGljbGVzID0gdGhpcy5jb21wb3NpdGVzW2NdLnBhcnRpY2xlcztcbiAgICAgICAgZm9yKGkgaW4gcGFydGljbGVzKSB7XG4gICAgICAgICAgICBwYXJ0aWNsZXNbaV0uZHJhdyh0aGlzLmN0eCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBoaWdobGlnaHQgbmVhcmVzdCAvIGRyYWdnZWQgZW50aXR5XG4gICAgdmFyIG5lYXJlc3QgPSB0aGlzLmRyYWdnZWRFbnRpdHkgfHwgdGhpcy5uZWFyZXN0RW50aXR5KCk7XG4gICAgaWYobmVhcmVzdCkge1xuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHguYXJjKG5lYXJlc3QucG9zLngsIG5lYXJlc3QucG9zLnksIEdsb2JhbFZhcmlhYmxlcy5oaWdobGlnaHRlZFBhcnRpY2xlUmFkaXVzLCAwLCAyICogTWF0aC5QSSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5oaWdobGlnaHRDb2xvcjtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgfVxufVxuXG5QaHlTaGl0LnByb3RvdHlwZS5uZWFyZXN0RW50aXR5ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGMsIGk7XG4gICAgdmFyIGQyTmVhcmVzdCA9IDA7XG4gICAgdmFyIGVudGl0eSA9IG51bGw7XG4gICAgdmFyIGNvbnN0cmFpbnROZWFyZXN0ID0gbnVsbDtcblxuICAgIC8vIGZpbmQgbmVhcmVzdCBwb2ludFxuICAgIGZvcihjIGluIHRoaXMuY29tcG9zaXRlcykge1xuICAgICAgICB2YXIgcGFydGljbGVzID0gdGhpcy5jb21wb3NpdGVzW2NdLnBhcnRpY2xlcztcbiAgICAgICAgZm9yKGkgaW4gcGFydGljbGVzKSB7XG4gICAgICAgICAgICB2YXIgZDIgPSBwYXJ0aWNsZXNbaV0ucG9zLmRpc3QyKHRoaXMubW91c2UpO1xuICAgICAgICAgICAgaWYoZDIgPD0gdGhpcy5zZWxlY3Rpb25SYWRpdXMgKiB0aGlzLnNlbGVjdGlvblJhZGl1cyAmJiAoZW50aXR5ID09IG51bGwgfHwgZDIgPCBkMk5lYXJlc3QpKSB7XG4gICAgICAgICAgICAgICAgZW50aXR5ID0gcGFydGljbGVzW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnROZWFyZXN0ID0gdGhpcy5jb21wb3NpdGVzW2NdLmNvbnN0cmFpbnRzO1xuICAgICAgICAgICAgICAgIGQyTmVhcmVzdCA9IGQyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gc2VhcmNoIGZvciBwaW5uZWQgY29uc3RyYWludCBmb3IgdGhpcyBlbnRpdHlcbiAgICBmb3IoaSBpbiBjb25zdHJhaW50TmVhcmVzdCkge1xuICAgICAgICBpZihjb25zdHJhaW50TmVhcmVzdFtpXSBpbnN0YW5jZW9mIFBpbkNvbnN0cmFpbnQgJiYgY29uc3RyYWludE5lYXJlc3RbaV0uYSA9PSBlbnRpdHkpIHtcbiAgICAgICAgICAgIGVudGl0eSA9IGNvbnN0cmFpbnROZWFyZXN0W2ldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGVudGl0eTtcbn1cbiIsIi8qXG4qICBhdXRob3IgOiBhYmhpc2hlayBnb3N3YW1pICggaGlybyApXG4qICBhYmhpc2hla2c3ODVAZ21haWwuY29tXG4qXG4qICAgdmVjMi5qcyA6IGEgc2ltcGxlIDItRCB2ZWN0b3IgaW1wbGVtZW50YXRpb25cbiovXG5cbi8qXG4gQ29weXJpZ2h0IDIwMTMgU3ViIFByb3RvY29sIGFuZCBvdGhlciBjb250cmlidXRvcnNcbiBodHRwOi8vc3VicHJvdG9jb2wuY29tL1xuXG4gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nXG4gYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0b1xuIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cbiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EXG4gTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRVxuIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT05cbiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5mdW5jdGlvbiBWZWMyKHgsIHkpIHtcbiAgICB0aGlzLnggPSB4IHx8IDA7XG4gICAgdGhpcy55ID0geSB8fCAwO1xufVxuXG5WZWMyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMueCArIHYueCwgdGhpcy55ICsgdi55KTtcbn1cblxuVmVjMi5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggLSB2LngsIHRoaXMueSAtIHYueSk7XG59XG5cblZlYzIucHJvdG90eXBlLm11bCA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gbmV3IFZlYzIodGhpcy54ICogdi54LCB0aGlzLnkgKiB2LnkpO1xufVxuXG5WZWMyLnByb3RvdHlwZS5kaXYgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIG5ldyBWZWMyKHRoaXMueCAvIHYueCwgdGhpcy55IC8gdi55KVxufVxuXG5WZWMyLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKGZhY3Rvcikge1xuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLnggKiBmYWN0b3IsIHRoaXMueSAqIGZhY3Rvcik7XG59XG5cblZlYzIucHJvdG90eXBlLm11dGFibGVTZXQgPSBmdW5jdGlvbih2KSB7XG4gICAgdGhpcy54ID0gdi54O1xuICAgIHRoaXMueSA9IHYueTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVmVjMi5wcm90b3R5cGUubXV0YWJsZUFkZCA9IGZ1bmN0aW9uKHYpIHtcbiAgICB0aGlzLnggKz0gdi54O1xuICAgIHRoaXMueSArPSB2Lnk7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblZlYzIucHJvdG90eXBlLm11dGFibGVTdWIgPSBmdW5jdGlvbih2KSB7XG4gICAgdGhpcy54IC09IHYueDtcbiAgICB0aGlzLnkgLT0gdi55O1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5WZWMyLnByb3RvdHlwZS5tdXRhYmxlTXVsID0gZnVuY3Rpb24odikge1xuICAgIHRoaXMueCAqPSB2Lng7XG4gICAgdGhpcy55ICo9IHYueTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVmVjMi5wcm90b3R5cGUubXV0YWJsZURpdiA9IGZ1bmN0aW9uKHYpIHtcbiAgICB0aGlzLnggLz0gdi54O1xuICAgIHRoaXMueSAvPSB2Lnk7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblZlYzIucHJvdG90eXBlLm11dGFibGVTY2FsZSA9IGZ1bmN0aW9uKGZhY3Rvcikge1xuICAgIHRoaXMueCAqPSBmYWN0b3I7XG4gICAgdGhpcy55ICo9IGZhY3RvcjtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuVmVjMi5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiB0aGlzLnggPT0gdi54ICYmIHRoaXMueSA9PSB2Lnk7XG59XG5cblZlYzIucHJvdG90eXBlLmVwc2lsb25FcXVhbHMgPSBmdW5jdGlvbih2LCBlcHNpbG9uKSB7XG4gICAgcmV0dXJuIE1hdGguYWJzKHRoaXMueCAtIHYueCkgPD0gZXBzaWxvbiAmJiBNYXRoLmFicyh0aGlzLnkgLSB2LnkpIDw9IGVwc2lsb247XG59XG5cbi8vIGxlc3MgZWZmaWNpZW50IHNpbmNlIHRoZSB1c2Ugb2YgdGhlIE1hdGguc3FydCBmdW5jdGlvblxuVmVjMi5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55KTtcbn1cblxuLy8gbW9yZSBlZmZpY2llbnQgdGhhbiB0aGUgYWJvdmVcblZlYzIucHJvdG90eXBlLmxlbmd0aDIgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueTtcbn1cblxuVmVjMi5wcm90b3R5cGUuZGlzdCA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuZGlzdDIodikpO1xufVxuXG5WZWMyLnByb3RvdHlwZS5kaXN0MiA9IGZ1bmN0aW9uKHYpIHtcbiAgICB2YXIgeCA9IHYueCAtIHRoaXMueDtcbiAgICB2YXIgeSA9IHYueSAtIHRoaXMueTtcbiAgICByZXR1cm4geCp4ICsgeSp5O1xufVxuXG5WZWMyLnByb3RvdHlwZS5ub3JtYWwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbSA9IE1hdGguc3FydCh0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkpO1xuICAgIHJldHVybiBuZXcgVmVjMih0aGlzLngvbSwgdGhpcy55L20pO1xufVxuXG5WZWMyLnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueTtcbn1cblxuVmVjMi5wcm90b3R5cGUuYW5nbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIE1hdGguYXRhbjIodGhpcy54ICogdi55IC0gdGhpcy55ICogdi54LCB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2LnkpO1xufVxuXG5WZWMyLnByb3RvdHlwZS5hbmdsZTIgPSBmdW5jdGlvbih2TGVmdCwgdlJpZ2h0KSB7XG4gICAgcmV0dXJuIHZMZWZ0LnN1Yih0aGlzKS5hbmdsZSh2UmlnaHQuc3ViKHRoaXMpKTtcbn1cblxuLypcbiAgICByb3RhdGlvbiBvZiBhIHZlY3RvciB0aHJvdWdoIGFuIGFuZ2xlIHRoZXRhIGFuZCBzaGlmdCBpbiB0aGUgb3JpZ2luXG4gICAgeCA9IHIgY29zKGluaXRpYWxfYW5nbGUpXG4gICAgeSA9IHIgc2luKGluaXRpYWxfYW5nbGUpXG4gICAgbm93IHJvdGF0aW9uIHRocm91Z2ggYW5kIGFuZ2xlIG9mIHRoZXRhXG4gICAgeCcgPSByIGNvcyhpbml0aWFsX2FuZ2xlICsgdGhldGEpXG4gICAgeScgPSByIGNvcyhpbml0aWFsX2FuZ2xlICsgdGhldGEpXG4gICAgc28gPT4geCcgPSB4IGNvcyh0aGV0YSkgLSB5IHNpbih0aGV0YSlcbiAgICAgICAgICB5JyA9IHkgY29zKHRoZXRhKSArIHggc2luKHRoZXRhKVxuICovXG5WZWMyLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbihvcmlnaW4sIHRoZXRhKSB7XG4gICAgdmFyIHggPSB0aGlzLnggLSBvcmlnaW4ueDtcbiAgICB2YXIgeSA9IHRoaXMueSAtIG9yaWdpbi55O1xuICAgIHJldHVybiBuZXcgVmVjMih4ICogTWF0aC5jb3ModGhldGEpIC0geSAqIE1hdGguc2luKHRoZXRhKSArIG9yaWdpbi54LCB4ICogTWF0aC5zaW4odGhldGEpICsgeSAqIE1hdGguY29zKHRoZXRhKSArIG9yaWdpbi55ICk7XG59XG5cblxuVmVjMi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXCIoXCIgKyB0aGlzLnggKyBcIiwgXCIgKyB0aGlzLnkgKyBcIilcIjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWZWMyOyJdfQ==
