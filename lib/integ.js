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