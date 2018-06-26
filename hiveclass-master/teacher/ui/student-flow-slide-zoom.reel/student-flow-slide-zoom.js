/**
 * @module ui/student-flow-slide-zoom.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class StudentFlowSlideZoom
 * @extends Component
 */
exports.StudentFlowSlideZoom = Component.specialize(/** @lends StudentFlowSlideZoom# */ {
    student: {
        value: null
    },

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                this.application.classroomService.getScreen(this.student);
            }
        }
    }
});
