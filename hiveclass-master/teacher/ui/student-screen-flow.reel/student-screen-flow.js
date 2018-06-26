/**
 * @module ui/student-screen-flow.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class StudentScreenFlow
 * @extends Component
 */
exports.StudentScreenFlow = Component.specialize(/** @lends StudentScreenFlow# */ {

    students: {
        value: null
    },

    page: {
        value: null
    },

    _studentsPages: {
        value: null
    },

    studentsPages: {
        get: function() {
            return this._studentsPages;
        },
        set: function(students) {
            this._studentsPages = [];
            var currentPage = [];
            for (var i = 0; i < students.length; i++) {
                if (currentPage.length === 4) {
                    this._studentsPages.push(currentPage);
                    currentPage = [];
                }
                currentPage.push(students[i]);
            }
            this._studentsPages.push(currentPage);
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.page = 0;
            }
        }
    }
});
