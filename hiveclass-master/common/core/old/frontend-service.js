/**
 * @module ./login-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target,
    WebSocketClient = require("./websocket-client").WebSocketClient;

/**
 * @class LoginService
 * @extends Montage
 */
exports.FrontEndService = Target.specialize(/** @lends LoginService# */ {


    constructor: {
        value: function FrontEndService() {
            this.super();

            this.connection = new WebSocketClient();
        }
    },


    connection: {
        value: null
    },


    addEventConnectionListener: {
        value: function (eventName, handler) {
            this.connection.addEventListener(eventName, handler, false);
        }
    },


    connect: {
        value: function () {
            this.connection.connect();
        }
    }

});
