/**
 * @module ./login-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target,
    request = require('montage/core/request');

/**
 * @class LoginService
 * @extends Target
 */
exports.LoginService = Target.specialize(/** @lends LoginService# */ {
    _provider: {
        value: null
    },

    _endpoint: {
        value: null
    },

    constructor: {
        value: function(configuration) {
            this._provider = configuration.provider;
            this._endpoint = configuration.endpoint;
        }
    },

    login: {
        value: function() {
            window.location.href = this._endpoint + '/' + this._provider;
        }
    }
});
