var assert = require('chai').assert;

assertions = {};

assertions.assertElementHasClass = function (element, className) {
    return element.getAttribute('class')
        .then(function (classes) {
            assert.include(classes.split(' '), className);
            return element;
        });
};

assertions.assertElementHasNotClass = function (element, className) {
    return element.getAttribute('class')
        .then(function (classes) {
            classes = classes || '';
            assert.notInclude(classes.split(' '), className);
            return element;
        });
};

assertions.assertElementHasText = function (element, expectedText) {
    return element.getText()
        .then(function (text) {
            assert.equal(text, expectedText);
            return element;
        });
};

module.exports = assertions;
