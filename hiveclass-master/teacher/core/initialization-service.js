/**
 * @module ./initialization-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target,
    Promise = require('montage/core/promise').Promise;

/**
 * @class TeacherService
 * @extends Montage
 */
exports.InitializationService = Target.specialize(/** @lends InitializationService# */ {
    steps: {
        value: null
    },

    _currentPosition: {
        value: null
    },

    step: {
        value: null
    },

    constructor: {
        value: function() {
            this.steps = [
                'name',
                'class'
            ];
        }
    },

    startInitialization: {
        value: function() {
            this._currentPosition = 0;
            this._setStep();
        }
    },

    _setStep: {
        value: function() {
            this.step = this.steps[this._currentPosition];
        }
    },

    goNext: {
        value: function() {
            if (this._currentPosition < this.steps.length - 1) {
                this._currentPosition++;
                this._setStep();
            }
        }
    },

    goPrevious: {
        value: function() {
            if (this._currentPosition > 0) {
                this._currentPosition--;
                this._setStep();
            }
        }
    }
});
