(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
*  author : abhishek goswami
*  abhishekg785@gmail.com
*
*  main.js : include all the modules here for testing
 */

var module1 = require('./module1');
var module2 = require('./module2');

// attaching them with the widow object to access them in browser
// i am writing modules in the browser ! cool :P
window.module1 = module1;
window.module2 = module2;
},{"./module1":2,"./module2":3}],2:[function(require,module,exports){
/*
*  author : abhishek goswami
*  abhishekg785@gmail.com
*
*  simple node type module to implement the same in the browser
 */

module.exports = module1;

function module1() {

    // module1 constructor
    (function(){
        console.log('in the module1 function');
    })();

}

module1.prototype.display = function() {
    console.log('in the display function of the module1');
}
},{}],3:[function(require,module,exports){
/*
 *  author : abhishek goswami
 *  abhishekg785@gmail.com
 *
 *  simple node type module to implement the same in the browser
 */

module.exports = module2;

function module2() {
    console.log(' in the module2 function');
}
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvZGVtby9tYWluLmpzIiwibGliL2RlbW8vbW9kdWxlMS5qcyIsImxpYi9kZW1vL21vZHVsZTIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qXG4qICBhdXRob3IgOiBhYmhpc2hlayBnb3N3YW1pXG4qICBhYmhpc2hla2c3ODVAZ21haWwuY29tXG4qXG4qICBtYWluLmpzIDogaW5jbHVkZSBhbGwgdGhlIG1vZHVsZXMgaGVyZSBmb3IgdGVzdGluZ1xuICovXG5cbnZhciBtb2R1bGUxID0gcmVxdWlyZSgnLi9tb2R1bGUxJyk7XG52YXIgbW9kdWxlMiA9IHJlcXVpcmUoJy4vbW9kdWxlMicpO1xuXG4vLyBhdHRhY2hpbmcgdGhlbSB3aXRoIHRoZSB3aWRvdyBvYmplY3QgdG8gYWNjZXNzIHRoZW0gaW4gYnJvd3NlclxuLy8gaSBhbSB3cml0aW5nIG1vZHVsZXMgaW4gdGhlIGJyb3dzZXIgISBjb29sIDpQXG53aW5kb3cubW9kdWxlMSA9IG1vZHVsZTE7XG53aW5kb3cubW9kdWxlMiA9IG1vZHVsZTI7IiwiLypcbiogIGF1dGhvciA6IGFiaGlzaGVrIGdvc3dhbWlcbiogIGFiaGlzaGVrZzc4NUBnbWFpbC5jb21cbipcbiogIHNpbXBsZSBub2RlIHR5cGUgbW9kdWxlIHRvIGltcGxlbWVudCB0aGUgc2FtZSBpbiB0aGUgYnJvd3NlclxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gbW9kdWxlMTtcblxuZnVuY3Rpb24gbW9kdWxlMSgpIHtcblxuICAgIC8vIG1vZHVsZTEgY29uc3RydWN0b3JcbiAgICAoZnVuY3Rpb24oKXtcbiAgICAgICAgY29uc29sZS5sb2coJ2luIHRoZSBtb2R1bGUxIGZ1bmN0aW9uJyk7XG4gICAgfSkoKTtcblxufVxuXG5tb2R1bGUxLnByb3RvdHlwZS5kaXNwbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ2luIHRoZSBkaXNwbGF5IGZ1bmN0aW9uIG9mIHRoZSBtb2R1bGUxJyk7XG59IiwiLypcbiAqICBhdXRob3IgOiBhYmhpc2hlayBnb3N3YW1pXG4gKiAgYWJoaXNoZWtnNzg1QGdtYWlsLmNvbVxuICpcbiAqICBzaW1wbGUgbm9kZSB0eXBlIG1vZHVsZSB0byBpbXBsZW1lbnQgdGhlIHNhbWUgaW4gdGhlIGJyb3dzZXJcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1vZHVsZTI7XG5cbmZ1bmN0aW9uIG1vZHVsZTIoKSB7XG4gICAgY29uc29sZS5sb2coJyBpbiB0aGUgbW9kdWxlMiBmdW5jdGlvbicpO1xufSJdfQ==
