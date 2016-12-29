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