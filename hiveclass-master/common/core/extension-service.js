/**
 * @module ./extension-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target,
    Promise = require('montage/core/promise').Promise;

/**
 * @class ExtensionService
 * @extends Montage
 */
exports.ExtensionService = Target.specialize(/** @lends ExtensionService# */ {
    _extensionId: {
        value: null
    },

    _ports: {
        value: null
    },

    _seq: {
        value: null
    },

    _messages: {
        value: null
    },

    _retries: {
        value: null
    },

    _handlers: {
        value: {}
    },

    handlers: {
        set: function(handlers) {
            this._handlers = handlers || {};
        }
    },

    constructor: {
        value: function() {
            this._seq = 1;
            this._messages = {};
            this._ports = {};
        }
    },

    send: {
        value: function(channel, message) {
            message.id = [channel, this._seq++].join('-');
            message.channel = channel;
            var msg = {
                target: 'extension',
                payload: message
            };
            window.postMessage(msg, location.href);
            message.deferred = Promise.defer();
            this._messages[message.id] = message;
            return message.deferred.promise;
        }
    },

    handleMessage: {
        value: function(msg) {
            if (msg.id) {
                var request = this._messages[msg.id];
                if (request) {
                    var deferred = request.deferred;
                    delete this._messages[msg.id];
                    delete request.deferred;
                    deferred.resolve({
                        request: request,
                        response: msg
                    });
                }
            }
        }
    }

});
