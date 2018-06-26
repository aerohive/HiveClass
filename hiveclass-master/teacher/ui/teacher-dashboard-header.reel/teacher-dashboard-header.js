/**
 * @module ui/teacher-dashboard-header.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class TeacherDashboardHeader
 * @extends Component
 */
exports.TeacherDashboardHeader = Component.specialize(/** @lends TeacherDashboardHeader# */ {

    templateDidLoad: {
        value: function () {
            var menu = this.application.dashboardMenus[0];
            this.templateObjects.repetition.contentController.select(menu);
        }
    }


});
