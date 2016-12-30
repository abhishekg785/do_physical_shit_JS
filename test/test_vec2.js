/*
*  author : abhishek goswami
*  abhishekg785@gmail.com
*
*  test_vec2.js : for testing the vec2.js
 */

var Vec2 = require('../lib/vec2');

function test_vec2() {
    var assert = function(label, expression) {
        console.log("Vec2(" + label + "):" + (expression == true ? "PASS" : "FAIL"));
        if(expression != true) {
            throw "assertion failed";
        }
    }

    assert("equality", (new Vec2(5,3).equals(new Vec2(5,3))));
    assert("epsilon equality", (new Vec2(1,2).epsilonEquals(new Vec2(1.01,2.02), 0.03)));
    assert("epsilon non-equality", !(new Vec2(1,2).epsilonEquals(new Vec2(1.01,2.02), 0.01)));
    assert("addition", (new Vec2(1,1)).add(new Vec2(2, 3)).equals(new Vec2(3, 4)));
    assert("subtraction", (new Vec2(4,3)).sub(new Vec2(2, 1)).equals(new Vec2(2, 2)));
    assert("multiply", (new Vec2(2,4)).mul(new Vec2(2, 1)).equals(new Vec2(4, 4)));
    assert("divide", (new Vec2(4,2)).div(new Vec2(2, 2)).equals(new Vec2(2, 1)));
    assert("scale", (new Vec2(4,3)).scale(2).equals(new Vec2(8, 6)));
    assert("mutable set", (new Vec2(1,1)).mutableSet(new Vec2(2, 3)).equals(new Vec2(2, 3)));
    assert("mutable addition", (new Vec2(1,1)).mutableAdd(new Vec2(2, 3)).equals(new Vec2(3, 4)));
    assert("mutable subtraction", (new Vec2(4,3)).mutableSub(new Vec2(2, 1)).equals(new Vec2(2, 2)));
    assert("mutable multiply", (new Vec2(2,4)).mutableMul(new Vec2(2, 1)).equals(new Vec2(4, 4)));
    assert("mutable divide", (new Vec2(4,2)).mutableDiv(new Vec2(2, 2)).equals(new Vec2(2, 1)));
    assert("mutable scale", (new Vec2(4,3)).mutableScale(2).equals(new Vec2(8, 6)));
    assert("length", Math.abs((new Vec2(4,4)).length() - 5.65685) <= 0.00001);
    assert("length2", (new Vec2(2,4)).length2() == 20);
    assert("dist", Math.abs((new Vec2(2,4)).dist(new Vec2(3,5)) - 1.4142135) <= 0.000001);
    assert("dist2", (new Vec2(2,4)).dist2(new Vec2(3,5)) == 2);

    var normal = (new Vec2(2,4)).normal()
    assert("normal", Math.abs(normal.length() - 1.0) <= 0.00001 && normal.epsilonEquals(new Vec2(0.4472, 0.89443), 0.0001));
    assert("dot", (new Vec2(2,3)).dot(new Vec2(4,1)) == 11);
    assert("angle", (new Vec2(0,-1)).angle(new Vec2(1,0))*(180/Math.PI) == 90);
    assert("angle2", (new Vec2(1,1)).angle2(new Vec2(1,0), new Vec2(2,1))*(180/Math.PI) == 90);
    assert("rotate", (new Vec2(2,0)).rotate(new Vec2(1,0), Math.PI/2).equals(new Vec2(1,1)));
    assert("toString", (new Vec2(2,4)) == "(2, 4)");
}

test_vec2();