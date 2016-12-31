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
    'particleColor' : '#2dad8f'
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