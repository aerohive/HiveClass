/**
 * @module ui/student-drop-target.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class StudentDropTarget
 * @extends Component
 */
exports.StudentDropTarget = Component.specialize(/** @lends StudentDropTarget# */ {
    position: {
        value: null
    },

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                var self = this;
                this.element.addEventListener('dragenter', function(event) {
                    self.handleDragEnter(event);
                }, false);
                this.element.addEventListener('dragleave', function(event) {
                    self.handleDragLeave(event);
                }, false);
                this.element.addEventListener('dragover', function(event) {
                    self.handleDragOver(event);
                }, false);
                this.element.addEventListener('drop', function(event) {
                    self.handleDrop(event);
                }, false);
            }
        }
    },

    handleDragEnter: {
        value: function(event) {
            this.active = true;
            event.preventDefault();
        }
    },

    handleDragLeave: {
        value: function(event) {
            this.active = false;
            event.preventDefault();
        }
    },

    handleDragOver: {
        value: function(event) {
            event.preventDefault();
        }
    },

    handleDrop: {
        value: function(event) {
            this.active = false;
            var studentEmail = event.dataTransfer.getData('studentEmail');
            this.dispatchEventNamed('moveStudent', true, true, { studentEmail: studentEmail, position: this.position });
        }
    }

});
