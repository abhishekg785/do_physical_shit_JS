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
