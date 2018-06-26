/**
 * @module focus-mode
 */
var AbstractMode = require('./abstract-mode').AbstractMode,
    Promise = require('montage/core/promise').Promise;
/**
 * @class FocusMode
 * @extends AbstractMode
 */
exports.FocusMode = AbstractMode.specialize(/** @lends FocusMode# */ {
    name: {
        value: 'focus'
    },

    onstop: {
        value: null
    },

    _from: {
        value: [
            'followme',
            'presenter',
            'focus'
        ]
    },

    _multiple: {
        value: true
    },

    _errorMessages: {
        value: {
            lock: "Please unlock all students before focusing resources."
        }
    },

    _rendezvousService: {
        value: null
    },

    constructor: {
        value: function(wsPresenceClient) {
            this._wsPresenceClient  = wsPresenceClient;
            this._superStartFromMode = this.startFromMode;
            this.startFromMode = this._startFromMode;
        }
    },

    _start: {
        value: function(resources) {
            var message = {
                type: 'resources',
                cmd: 'update',
                focused: resources
            };
            this._wsPresenceClient.sendToClients(message, Math.random()*500);
        }
    },

    _startFromMode: {
        value: function(previousMode, args) {
            var status,
                resultPromise;
            if (args && args[0].children && args[0].children.length > 0) {
                status = this._superStartFromMode(previousMode, args);
                resultPromise = Promise.resolve(status);
            } else {
                resultPromise = this.stop();
            }
            return resultPromise;
        }
    },

    _stop: {
        value: function() {
            var message = {
                type: 'resources',
                cmd: 'update',
                focused: []
            };
            this._wsPresenceClient.sendToClients(message);
            if (typeof this.onstop === 'function' && !this.onstopCalled) {
                this.onstop();
            }
        }
    }
});
