/**
 * @module ./view-screen-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target;

/**
 * @class ViewScreenService
 * @extends Target
 */
exports.ViewScreenService = Target.specialize(/** @lends ViewScreenService# */ {
    PAGE_SIZE: {
        value: 4
    },

    _classroomService: {
        value: null
    },

    isInViewScreen: {
        value: false
    },

    _singleStudent: {
        value: null
    },

    _students: {
        value: []
    },

    displayPages: {
        value: []
    },

    constructor: {
        value: function(classroomService) {
            this._classroomService = classroomService;
            this._classroomService.registerListener('studentsChange', this)
        }
    },

    enterViewScreen: {
        value: function(student) {
            var self = this,
                connectedStudents = self._classroomService.classroom.students;
            this._singleStudent = student;
            this._students = this._classroomService.classroom.registeredStudents.filter(function (obj) { return connectedStudents.indexOf(obj) != -1; });
            this._refreshStudents(this._students);
            this.isInViewScreen = true;
            return this.displayPages;
        }
    },

    exitViewScreen: {
        value: function() {
            this.isInViewScreen = false;
        }
    },

    startViewing: {
        value: function(page) {
            for (var i = page * 4, j = 0; j < 4  && i+j < this._students.length; j++) {
                this._classroomService.startViewingScreen(this._students[i+j])
            }
        }
    },

    stopViewing: {
        value: function(page) {
            if (typeof page === 'number') {
                for (var i = page * 4, j = 0; j < 4  && i+j < this._students.length; j++) {
                    this._classroomService.pauseViewingScreen(this._students[i+j])
                }
            }
        }
    },

    handleStudentsChange: {
        value: function(event) {
            if (this.isInViewScreen) {
                var students = event.detail;
                this._refreshStudents(students);
            }
        }
    },

    _refreshStudents: {
        value: function (students) {
            if (!this._singleStudent) {
                this._students = students;
            } else {
                if (students.map(function (x) { return x.email; }).indexOf(this._singleStudent.email) != -1) {
                    this._students = [this._singleStudent];
                } else {
                    this._students = [];
                }
            }
            this.displayPages = this._paginateStudents(this._students);
        }
    },

    _paginateStudents: {
        value: function (students) {
            var displayPages = [];
            if (students.length > 0) {
                var page = [];
                for (var i = 0; i < students.length; i++) {
                    if (page.length === this.PAGE_SIZE) {
                        displayPages.push(page);
                        page = [];
                    }
                    page.push(students[i]);
                }
                page = page.concat([{}, {}, {}, {}]);
                page.splice(this.PAGE_SIZE, this.PAGE_SIZE);
                displayPages.push(page);
            }
            return displayPages;
        }
    }
});
