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
        this.x = 30;
        this.y = 30;
        this.draw();
    }

    Particle.prototype.draw = function() {
        this.ctx.clearRect(0, 0, $Objects.canvas.height, $Objects.canvas.width);
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
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

        // fixing y position
        if(Globals.particle.y > this.height - 1) {
            Globals.particle.y = this.height - 2;
        }

        if(Globals.particle.x < 0) {
            Globals.particle.x = 0;
        }

        if(Globals.particle.x > this.width - 1) {
            Globals.particle.x = this.width - 1;
        }

    }

    function applyGravity() {
        Globals.particle.y += 0.7;
        console.log(Globals.particle.x);
        Globals.particle.draw();
        Globals.particle.bounds();
        w.requestAnimationFrame(applyGravity);
    }

    $Objects = {};
    $w.on('load', function() {
        $Objects.canvas = $('#canvas')[0];
        Globals.particle = new Particle($Objects.canvas);
        // applyGravity();
    });


})(jQuery, jQuery(document), jQuery(window), document, window);
