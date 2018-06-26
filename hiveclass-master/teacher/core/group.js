/**
 * @module ui/teacher-dashboard-groups.reel
 * @requires montage/ui/component
 */
var Montage = require("montage/core/core").Montage;

/**
 * @class TeacherDashboardGroups
 * @extends Component
 */

exports.Group = Montage.specialize(/** @lends TeacherDashboardGroups# */ {
    constructor: {
        value: function Group() {
            this.super();
			this.studentList = [];
        }
    },
	name: {
		value:null
	},
	studentList: {
		value:null
	}
});
