/**
 * @module ui/initialization-classroom.reel
 */
var Component = require("montage/ui/component").Component,
    Application = require("montage/core/application").application,
    DigitRadioButton = require("digit/ui/radio-button.reel").RadioButton,
    MontageText = require("montage/ui/text.reel").Text;

/**
 * @class InitializationClassroom
 * @extends Component
 */
var InitializationClassroom = exports.InitializationClassroom = Component.specialize(/** @lends InitializationClassroom# */ {
    existingClass: {
        value: null
    },

    newClassName: {
        value: null
    },

    classrooms: {
        value: null
    },

    _isListeningClick: {
        value: false
    },

    enterDocument: {
        value: function enterDocument(firstTime) {
            if (!firstTime && this.application.classroomService.mustReload) {
                location.reload();
            }

            var self = this;
            this.newClassName = null;
            this.existingClass = null;


            this.templateObjects.radioButtonController.selectedRadioButton.checked = false;
            this.templateObjects.newClassroomRadio.checked = false;
            Application.classroomService.list()
                .then(function(classrooms) {
                    self.classrooms = classrooms;

                    if (classrooms.length) {
                        self._isListeningClick = true;
                        self.templateObjects.repetition.element.addEventListener("click", self, false);
                    }
                });

            Application.analyticsService.trackView({
                'screenName': "Init - Class"
            });

        }
    },

    exitDocument: {
        value: function () {
            if (this._isListeningClick) {
                this.templateObjects.repetition.element.removeEventListener("click", this, false);
            }
        }
    },

    handleEnterAction: {
        value: function() {
            if (this.newClassName || this.existingClass) {
                var self = this;
                Application.teacherService.getProfile()
                    .then(function(profile) {
                        var className = self.newClassName || self.existingClass.name;
                        var classId = self.existingClass ? self.existingClass.id : null;
                        return Application.classroomService.enter(profile.email, className, classId)
                    })
                    .then(function(classroom) {
                        Application.classroom = classroom;
                        Application.classroom.students = [];
                        if (self.newClassName) {
                            Application.classroomService.save(classroom);
                        }
                        Application.state = Application.states.dashboard;
                        self.existingClass = null;
                        self.newClassName = null;
                    })
            }
        }
    },

    handleClick: {
        value: function (event) {
            var target = event.target;

            if (target && target.tagName === "LABEL" && target.component instanceof Label) {
                var switchTarget = document.getElementById(target.component.for);

                if (switchTarget && switchTarget.component instanceof RadioButton && !switchTarget.component.checked) {
                    switchTarget.component.checked = true;
                    switchTarget.component.check();
                }
            }
        }
    },

    didBeginEditing: {
        value: function () {
            var newClassroomRadio = this.templateObjects.newClassroomRadio;

            if (!newClassroomRadio.checked && this.newClassName) {
                newClassroomRadio.checked = true;
                newClassroomRadio.check();
            }
        }
    }

});


InitializationClassroom.prototype.handleAddClassAction = InitializationClassroom.prototype.handleEnterAction;
InitializationClassroom.prototype.handleCreateFirstClassAction = InitializationClassroom.prototype.handleEnterAction;


var RadioButton = exports.RadioButton = DigitRadioButton.specialize();

RadioButton.prototype._templateModuleId = DigitRadioButton.prototype.templateModuleId;

RadioButton.addAttributes({
    id: {value: null, dataType: 'string'}
});


var Label = exports.Label = MontageText.specialize();

Label.addAttributes({
    for: {value: null, dataType: 'string'}
});
