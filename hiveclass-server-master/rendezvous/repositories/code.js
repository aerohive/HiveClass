var Promise = require('bluebird');

exports.CodeRepository = function CodeRepository() {
    this._storage = [];

    this.getNew = function(maxLength, minLength) {
        minLength = minLength || maxLength;
        var code = this._generateCode(maxLength, minLength);
        while (this._storage.indexOf(code) != -1) {
            code = this._generateCode(maxLength, minLength);
        }
        this._storage.push(code);
        this._storage.sort();
        return Promise.resolve(code);
    };

    this.release = function(code) {
        this._storage.splice(this._storage.indexOf(code), 1);
        return Promise.resolve();
    };

    this._generateCode = function(maxLength, minLength) {
        var code = 0;
        while (code < Math.pow(10, minLength-1)) {
            code = Math.round(Math.random() * Math.pow(10, maxLength));
        }
        return ''+code;
    }
};
