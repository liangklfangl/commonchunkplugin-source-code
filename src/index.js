// var $ = require('jquery');

// $('body').html('Hello');


// import $ from 'jquery';
// $('body').html('Hello');


// import Button from './Components/Button';
// const button = new Button('google.com');
//  button.render('a');

//code splitting
if (document.querySelectorAll('a').length) {
    require.ensure([], () => {
        const Button = require('./Components/Button').default;
        const button = new Button('google.com');
        button.render('a');
    });
}

if (document.querySelectorAll('h1').length) {
    require.ensure([], () => {
        const Header = require('./Components/Header').default;
        new Header().render('h1');
    });
}