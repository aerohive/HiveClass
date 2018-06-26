/**
 * @module abstract-mode
 */
var Montage = require("montage/core/core").Montage,
    Promise = require('montage/core/promise').Promise,
    Status = require("core/modes/status").Status;
/**
 * @class AbstractMode
 * @extends Montage
 */
exports.AbstractMode = Montage.specialize(/** @lends AbstractMode# */ {
    name: {
        value: null
    },

    _from: {
        value: null
    },

    _errorMessages: {
        value: null
    },

    _multiple: {
        value: false
    },

    _ensureIsInitialized: {
        value: function () {
            if (!this.name || !this._from) {
                throw new Error("Invalid usage of uninitialized ModeService");
            }
        }
    },

    _isStartFromModeAuthorized: {
        value: function (previousMode) {
            var status = new Status(this);
            status.success = !previousMode || this._from.indexOf(previousMode.name) != -1 || (this.name === previousMode.name && this._multiple);
            if (!status.success) {
                status.message = this._errorMessages[previousMode.name] || 'Invalid transition from "' + previousMode.name + '" to "' + this.name + '"';
            }
            return status;
        }
    },

    _stopPreviousMode: {
        value: function(previousMode, stopArgs) {
            if (previousMode && !(this.name === previousMode.name && this._multiple)) {
                return previousMode.stop(stopArgs);
            } else {
                return Promise.resolve();
            }
        }
    },

    startFromMode: {
        value: function(previousMode, args, stopArgs) {
            this._ensureIsInitialized();
            var status = this._isStartFromModeAuthorized(previousMode);
            if (status.success) {
                var self = this;
                this._stopPreviousMode(previousMode, stopArgs)
                    .then(function() {
                        self._start.apply(self, args);
                    });
            }
            return status;
        }
    },

    _start: {
        value: function(args) {
            throw new Error("Invalid usage of incorrectly initialized ModeService");
        }
    },

    stop: {
        value: function(args) {
            var stopResult = this._stop.apply(this, args);
            stopResult = (stopResult instanceof Promise) ? stopResult : Promise.resolve();
            return stopResult
                .delay(500)
                .then(function() {
                    var status = new Status(null);
                    status.success = true;
                    return status;
                });
        }
    },

    _stop: {
        value: function(args) {
            throw new Error("Invalid usage of incorrectly initialized ModeService");
        }
    },

    join: {
        value: function(peerId) {
            this._join(peerId);
        }
    },

    _join: {
        value: function(peerId) {
            throw new Error("Invalid usage of incorrectly initialized ModeService");
        }
    }
});
