/**
 * @module ui/close-tabs-modal.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class CloseTabsModal
 * @extends Component
 */
exports.CloseTabsModal = Component.specialize(/** @lends CloseTabsModal# */ {
    enterDocument: {
        value: function(firstTime) {
            this.templateObjects.modal.enterDocument(firstTime);
            this.templateObjects.modal.show();
        }
    },

    valid: {
        value: function() {
            var self = this;
            this.application.classroomService.closeTabs()
                .then(function() {
                    self.application.state = self.application.states.dashboard;
                });
        }
    },

    cancel: {
        value: function() {
            this.application.classroomService.exitClass();
        }
    }
});
