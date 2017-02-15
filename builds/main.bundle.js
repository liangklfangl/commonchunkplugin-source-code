webpackJsonp([4],{

/***/ 4:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// var $ = require('jquery');

// $('body').html('Hello');


// import $ from 'jquery';
// $('body').html('Hello');


// import Button from './Components/Button';
// const button = new Button('google.com');
//  button.render('a');

//code splitting
if (document.querySelectorAll('a').length) {
    __webpack_require__.e/* require.ensure */(3).then((function () {
        var Button = __webpack_require__(0).default;
        var button = new Button('google.com');
        button.render('a');
    }).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
}

if (document.querySelectorAll('h1').length) {
    __webpack_require__.e/* require.ensure */(1).then((function () {
        var Header = __webpack_require__(2).default;
        new Header().render('h1');
    }).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
}

/***/ })

},[4]);