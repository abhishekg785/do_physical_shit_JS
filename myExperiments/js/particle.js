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

    window.requestAnimationFrame = window.requestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.oRequestAnimationFrame
        || function(callback) {                          // in case browser does not support requestAnimationFrame
            window.setTimeout(callback, 1000 / 60);
        }

    var Globals = {

    };

    function Particle(canvas) {
        this.ctx = canvas.getContext('2d');
        this.radius = 30;
        this.x = 30;
        this.y = 30;
        this.draw();
    }

    Particle.prototype.draw = function() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        this.ctx.fillStyle = "red";
        this.ctx.fill();
    }

    $Objects = {};
    $w.on('load', function() {
        $Objects.canvas = $('#canvas')[0];
        new Particle($Objects.canvas);
    });


})(jQuery, jQuery(document), jQuery(window), document, window);
