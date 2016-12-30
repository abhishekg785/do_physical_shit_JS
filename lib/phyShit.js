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

exports = module.exports = PhyShit;
exports.Particle = Particle;
exports.Composite = Composite;

function Particle() {

}

function Composite() {

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
    this.composites = [];

}

PhyShit.prototype.Composite = Composite;

function Composite() {
    this.particles = [];   // contains the particles to play with :P
    this.contraints = [];  // contains the constrains applied on them

    this.drawParticles = null;
    this.drawConstraints = null;
}


PhyShit.prototype.nearestEntity = function() {
    var c, i;
    var d2Nearest = 0;
    var entity = null;
    var constraintNearest = null;

    // find nearest point
    for(c in this.composites) {

    }

}