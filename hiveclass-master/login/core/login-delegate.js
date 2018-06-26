/**
 * @module ./login-delegate
 * @requires montage/core/core
 */
var Montage = require("montage/core/core").Montage,
    loginConfiguration = require("./configuration.json"),
    LoginService = require("./login-service").LoginService;


/**
 * @class LoginDelegate
 * @extends Montage
 */
exports.LoginDelegate = Montage.specialize(/** @lends LoginDelegate# */ {

    willFinishLoading: {
        value: function (app) {
            app.service = new LoginService(loginConfiguration);
        }
    }

});
