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

    function init() {

    }

    function Particle(canvas) {
        this.ctx = canvas.getContext('2d');
        this.radius = 30;
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

    function applyGravity() {
        Globals.particle.y += 0.7;
        console.log(Globals.particle.x);
        Globals.particle.draw();
        w.requestAnimationFrame(applyGravity);
    }

    $Objects = {};
    $w.on('load', function() {
        $Objects.canvas = $('#canvas')[0];
        Globals.particle = new Particle($Objects.canvas);
        // applyGravity();
    });


})(jQuery, jQuery(document), jQuery(window), document, window);
