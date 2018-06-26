/**
 * @module ui/enter-class.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    DigitRadioButton = require("digit/ui/radio-button.reel").RadioButton;

/**
 * @class EnterClass
 * @extends Component
 */
exports.EnterClass = Component.specialize(/** @lends EnterClass# */ {

    accessCode: {
        value: null
    },

    classroomId: {
        value: null
    },

    errorMessage: {
        value: null
    },

    classPicker: {
        value: []
    },

    _isListeningClick: {
        value: false
    },

    classrooms: {
        value: null
    },

    _isClicked: {
        value: false
    },

    _connectionAttempts: {
        value: 0
    },

    enterDocument: {
        value: function enterDocument (firstTime) {
            var self = this;

            if (!firstTime && this.application.classroomService.mustReload) {
                location.reload();
            }

            this.application.classroomService.listOpenClassrooms().then(function () {
                if (self.classrooms && self.classrooms.length) {
                    if (self.classrooms.length === 1) {
                        self.classroomId = self.classrooms[0].id;
                    }

                    self.templateObjects.repetition.element.addEventListener("click", self, false);
                    self._isListeningClick = true;
                }
            }).done();

            var domain = this.application.student.email.substring(
                this.application.student.email.indexOf('@') + 1,
                this.application.student.email.length
            );
            this.application.analyticsService.userId = this.application.student.email;
            this.application.analyticsService.set('dimension2', domain);
            this.application.analyticsService.trackView({
                'screenName': "Init - Class"
            });
        }
    },

    _removeListenersIfNeeded: {
        value: function () {
            if (this._isListeningClick) {
                this.templateObjects.repetition.element.removeEventListener("click", this, false);
                this._isListeningClick = false;
            }
        }
    },

    exitDocument: {
        value: function () {
            this._removeListenersIfNeeded();
        }
    },

    handleAddClassAction: {
        value: function () {
            this.application.state = this.application.states.joinClass;

        }
    },

    handleEnterClassAction: {
        value: function () {
            if (!this.isClicked) {
                this.isClicked = true;
                
                if (this.classroomId) {
                    var self = this;
                    //fire a message to check student cpu
                    self.application.classroomService._cpuCheck()
                        .then(function(info) {
                            console.log(info);
                            var arch = info.response.data.archName.toLowerCase();
                            if(info.response.data.numOfProcessors < 2) {
                                self.application.student.strongCpu = false;
                            } 
                            else if(arch.indexOf('armv7') !== -1) {
                                self.application.student.strongCpu = false;
                            }
                            else {
                                self.application.student.strongCpu = true;
                            }
                        });

                    setTimeout(function() {
                        self.isClicked = false;
                    }, 10000);
                    this.application.classroomJoinerService.joinUsingId(this.classroomId)
                        .catch(function() {
                            self.application.state = self.application.states.enterClass;
                            if (self._connectionAttempts++ < 5) {
                                self.isClicked = false;
                                self.handleEnterClassAction();
                            } else {
                                location.reload();
                            }
                        })
                        .finally(function() {
                            self.isClicked = false;
                        });
                } else {
                    this.isClicked = false;
                }
            }

        }
    },

    handleClick: {
        value: function (event) {
            var target = event.target;

            if (target && target.component instanceof Label) {
                var switchTarget = document.getElementById(target.component.for);

                if (switchTarget && switchTarget.component instanceof RadioButton && !switchTarget.component.checked) {
                    switchTarget.component.checked = true;
                    switchTarget.component.check();
                }
            }
        }
    }

});


var RadioButton = exports.RadioButton = DigitRadioButton.specialize();

RadioButton.prototype._templateModuleId = DigitRadioButton.prototype.templateModuleId;

RadioButton.addAttributes({
    id: {value: null, dataType: 'string'}
});


var Label = exports.Label = Component.specialize({
    hasTemplate: {
        value: false
    }
});

Label.addAttributes({
    for: {value: null, dataType: 'string'}
});
