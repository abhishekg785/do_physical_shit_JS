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