/*
*  author : abhishek goswami ( hiro )
*  abhishekg785@gmail.com
*
*   vec2.js : a simple 2-D vector implementation
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

Vec2.prototype.mutableSet = function() {
    this.x = v.x;
    this.y = v.y;
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