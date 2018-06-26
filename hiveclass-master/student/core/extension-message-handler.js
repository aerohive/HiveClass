/**
 * @module ./extension-message-handler
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target,
    Promise = require('montage/core/promise').Promise;

/**
 * @class ExtensionMessageHandler
 * @extends Target
 */
exports.ExtensionMessageHandler = Target.specialize(/** @lends ExtensionMessageHandler# */ {
    _classroomService: {
        value: null
    },

    constructor: {
        value: function(classroomService) {
            this._classroomService = classroomService;
        }
    },

    screen: {
        value: function(msg) {
            switch (msg.cmd) {
                case 'endShare':
                    alert("Screen sharing is mandatory to stay in the classroom.");
                    this._classroomService.exitClass();
                    break;
            }
        }
    },

    tracking: {
        value: function(msg) {
            this._classroomService.sendTrackingEvent(msg.event);
        }
    }
});
