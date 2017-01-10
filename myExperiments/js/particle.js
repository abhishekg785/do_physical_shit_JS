/**
 *  @author : abhishek goswami
 *  abhishekg785@gmail.com
 *
 */

/*
 to do bro :)
 first create a particle on the canvas
 then experiment with it
 */

(function($, $d, $w, d, w) {

    w.requestAnimationFrame = w.requestAnimationFrame
        || w.webkitRequestAnimationFrame
        || w.mozRequestAnimationFrame
        || w.oRequestAnimationFrame
        || function(callback) {                          // in case browser does not support requestAnimationFrame
            w.setTimeout(callback, 1000 / 60);
        }

    var Globals = {
        particle : null
    };


    function Particle(canvas) {
        this.canvas = canvas;
        this.height = canvas.height;
        this.width = canvas.width;
        this.ctx = canvas.getContext('2d');
        this.radius = 10;
        this.pos = new Vec(30, 30);
        this.mouse = new Vec(0, 0);
        this.mouseDown = false;
        this.draggedEntity = null;

        // parameters for adding simulation to the universe
        this.gravity = new Vec(0, 9.8);

        // functions related to the canvas

        var _this = this;
        _this.canvas.oncontextmenu = function() {
            e.preventDefault();
        }

        _this.canvas.onmouseup = function(e) {
            _this.mouseDown = false;
            _this.draggedEntity = null;
        }

        _this.canvas.onmousedown = function(e) {
            _this.mouseDown = true;
            _this.draggedEntity = Globals.particle;
        }

        _this.canvas.onmousemove = function(e) {
            var rect = _this.canvas.getBoundingClientRect();
            _this.mouse.x = e.clientX - rect.left;
            _this.mouse.y = e.clientY - rect.top;
        }
    }

    Particle.prototype.draw = function() {
        this.ctx.clearRect(0, 0, $Objects.canvas.width, $Objects.canvas.height);
        this.ctx.beginPath();
        this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2*Math.PI);
        this.ctx.fillStyle = "red";
        this.ctx.fill();
    }

    /*
     preventing the particle to not pass through the canvas bounds
     x = get the x pos of particle
     y = get the y pos of the particle
     conditions :
     x > 0 && x < this.width
     y < this.height

     */
    Particle.prototype.bounds = function() {

        console.log('in the bound function');
        // fixing y position
        if(Globals.particle.pos.y > this.height - 30) {
            Globals.particle.pos.y = this.height - 30;
        }

        if(Globals.particle.pos.x < 0) {
            Globals.particle.pos.x = 0;
        }

        if(Globals.particle.pos.x > this.width - 1) {
            console.log('vklfnvklnfv');
            Globals.particle.pos.x = this.width - 1;
        }

    }

    Particle.prototype.makeDrag = function() {
        if(this.draggedEntity) {
            this.pos.mutableSet(this.mouse);
        }
    }

    // responsible for the pull of the particle in the downward direction
    // handle the dragging of the particle too.
    Particle.prototype.applyGravity = function() {
        this.pos.y += this.gravity.y;
        this.draw();
        this.bounds();
        this.makeDrag();
    }

    // vector class for implementing vector  ( some math shit :P )
    function Vec(x, y) {
        this.x = x || 0;
        this.y = y || 0;
        return this;
    }

    Vec.prototype.set = function(pos) {

    }

    Vec.prototype.mutableSet = function(pos) {
        this.x = pos.x;
        this.y = pos.y;
    }

    $Objects = {};
    $w.on('load', function() {
        $Objects.canvas = $('#canvas')[0];
        Globals.particle = new Particle($Objects.canvas);
        function animate() {
            Globals.particle.applyGravity();
            w.requestAnimationFrame(animate);
        }
        animate();
    });


})(jQuery, jQuery(document), jQuery(window), document, window);
