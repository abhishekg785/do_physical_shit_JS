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