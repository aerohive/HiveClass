/**
 * @module ui/login.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    configuration = require("core/configuration.json");

/**
 * @class Login
 * @extends Component
 */
exports.Login = Component.specialize(/** @lends Login# */ {
    loginUrl: {
        get: function() {
            return configuration.endpoint + '/' + configuration.provider + location.search;

        }
    },

    _forbiddenDomainMessage: {
        value:  "Welcome to HiveSchool.\n" +
                "To enable HiveSchool for your school, please register your domain(s) here:  http://info.aerohive.com/hive-school.html.\n" +
                "\n" +
                "If you have multiple domains associated with teachers and students, please submit an entry for each.\n" +
                "We will enable HiveSchool for your account within 24 hours.\n" +
                "\n" +
                "For issues with registration, please contact developer.portal@aerohive.com\n"
    },

    enterDocument: {
        value: function() {
            if (this._getCause() === 'forbidden-hd') {
                if (confirm(this._forbiddenDomainMessage)) {
                    location.href = 'http://info.aerohive.com/hive-school.html';
                }
            }
        }
    },

    _getCause: {
        value: function() {
            if (location.search && location.search.indexOf('cause=') != -1) {
                var keyValues = location.search.substr(1).split('&');
                for (var i = 0; i < keyValues.length; i++) {
                    if (keyValues[i].indexOf('cause=') == 0) {
                        return keyValues[i].split('=')[1];
                    }
                }
            }
        }
    }

});
