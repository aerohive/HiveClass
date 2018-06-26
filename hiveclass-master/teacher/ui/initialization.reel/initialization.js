/**
 * @module ui/initialization.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    InitializationService = require("core/initialization-service").InitializationService,
    Application = require("montage/core/application").application,
    Bindings = require("montage/core/core").Bindings;

/**
 * @class Initialization
 * @extends Component
 */
exports.Initialization = Component.specialize(/** @lends Initialization# */ {

    service: {
        value: null
    },

    teacher: {
        value: null
    },

    step: {
        value: null
    },

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                this.service = new InitializationService();
                this.service.startInitialization();
                if (Application.teacher.usageName) {
                    this.service.goNext();
                }
                Bindings.defineBinding(this, 'step', {'<-': 'this.service.step'});
            }
        }
    }
});
