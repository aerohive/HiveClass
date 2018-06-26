/**
 * @module ui/initialization-teacher.reel
 */
var Component = require("montage/ui/component").Component,
    Application = require("montage/core/application").application;

/**
 * @class TeacherName
 * @extends Component
 */
exports.InitializationTeacher = Component.specialize(/** @lends InitializationTeacher# */ {
    teacherName: {
        value: null
    },

    _isClicked: {
        value: false
    },

    isClicked: {
        get: function() {
            return this._isClicked;
        },
        set: function(isClicked) {
            this._isClicked = isClicked;
        }
    },

    constructor: {
        value: function TeacherName() {
            var teacher = Application.teacher;
            if (teacher.gender) {
                this.teacherName = [teacher.gender == 'male' ? 'Mr.' : 'Mrs.', teacher.lastname].join(' ');
            } else {
                this.teacherName = teacher.lastname;
            }
        }
    },

    handleAction: {
        value: function() {
            if (!this.isClicked) {
                this.isClicked = true;
                if (this.teacherName) {
                    var self = this;
                    Application.teacherService.setTeacherName(this.teacherName)
                        .then(function () {
                            self.isClicked = false;
                            self.ownerComponent.service.goNext();
                        })
                } else {
                    this.isClicked = false;
                }
            }
        }
    },

    enterDocument: {
        value: function (firstTime) {
            var domain = Application.teacher.email.substring(
                Application.teacher.email.indexOf('@') + 1,
                Application.teacher.email.length
            );
            Application.analyticsService.userId = this.application.teacher.email;
            Application.analyticsService.set('dimension2', domain);
            Application.analyticsService.trackView({
                'screenName': "Init - Name"
            });
        }
    }

});
