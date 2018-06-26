/**
 * @module ui/teacher-dashboard-students.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Bindings = require("montage/core/core").Bindings;

/**
 * @class TeacherDashboardStudents
 * @extends Component
 */
exports.TeacherDashboardStudents = Component.specialize(/** @lends TeacherDashboardStudents# */ {

    _teacher: {
        value: null
    },

    _studentList: {
        value: null
    },

    studentList: {
        get: function () {
            return this._studentList;
        },
        set: function (studentList) {
            this._studentList = studentList;

            if (studentList && this.isStudentsListSorted) {
                this._studentList.sort(this._studentsSorter);
            }
        }
    },

    _isStudentsListSorted: {
        value: null
    },

    isStudentsListSorted: {
        get: function () {
            return this._isStudentListSorted;
        },
        set: function (isStudentListSorted) {
            this._isStudentListSorted = isStudentListSorted;

            if (this._studentList && this.isStudentsListSorted) {
                this._studentList.sort(this._studentsSorter);
            }
        }
    },

    teacher: {
        set: function (teacher) {
            this._teacher = teacher;

            if (teacher){
                this.teacherClassMessage = (teacher.gender == 'male' ? 'Mr. ' : 'Ms. ') + teacher.lastname + "'s Class";
            }
        },
        get: function () {
            return this._teacher;
        }
    },

    areStudentFollowing: {
        value: false
    },

    isAttentionOn: {
        value: false
    },

    teacherClassMessage: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.element.addEventListener("webkitTransitionEnd", this, false);
                this.addRangeAtPathChangeListener("studentList", this, "handleStudentListChange");
                this.addRangeAtPathChangeListener("connectedStudents", this, "handleConnectedStudentsChange");
            }
        }
    },

    handleStudentListChange: {
        value: function () {
            if (this._studentList && this.isStudentsListSorted) {
                var self = this;

                //fixme: hacky no idea why we need to set a timer here.
                setTimeout(function () {
                    if (self._studentList) {
                        self._studentList.sort(self._studentsSorter);
                    }
                }, 0);
            }
        }
    },

    handleConnectedStudentsChange: {
        value: function () {
            this._isSharingEnabled = true;
                
            if(this.connectedStudents){ 
                for (i=0; i<this.connectedStudents.length; i++){
                    if(this.connectedStudents[i].strongCpu == false) {
                        this._isSharingEnabled = false;
                    }
                }
                if(this.connectedStudents.length >= 8) {
                    this.application.classroomService._topologyService._strongMesh = false;
                }
            }
        }
    },

    handleWebkitTransitionEnd: {
        value: function () {
            this.templateObjects.studentList.needsDraw = true;
            this.templateObjects.studentList.isAnimationEnd = true;
        }
    },

    handleViewScreensButtonAction : {
        value: function () {
            this.application.state = this.application.states.screens;
        }
    },

    handleFollowMeButtonAction : {
        value: function () {
            if (!this.areStudentFollowing) {
                this.application.classroomService.startFollowMe();
            } else {
                this.application.classroomService.stopFollowMe();
            }
        }
	},

    handleLockAllButtonAction : {
        value: function () {
            if (!this.isAttentionOn) {
                this.application.classroomService.getAttention();
            } else {
                this.application.classroomService.releaseAttention();
            }
        }
	},

    handleResetOrderAction : {
        value: function () {
            this.application.classroomService.resetStudentsOrder();
        }
    },

    handleResourcesButtonAction : {
        value: function () {
            this.application.state = this.application.states.resources;
        }
    },

    handleReportingButtonAction: {
        value: function() {
            this.application.state = this.application.states.reporting;
        }
    },

    _studentsSorter: {
        value: function(a, b) {
            var nameA = (a.firstname + ' ' + a.lastname + ' ' + a.email).toLowerCase(),
                nameB = (b.firstname + ' ' + b.lastname + ' ' + b.email).toLowerCase();

            return nameA > nameB ? 1 : -1;
        }
    }

});
