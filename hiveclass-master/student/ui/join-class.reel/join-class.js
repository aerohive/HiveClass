/**
 * @module ui/join-class.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class JoinClass
 * @extends Component
 */
var JoinClass = exports.JoinClass = Component.specialize(/** @lends JoinClass# */ {


    classrooms: {
        value: null
    },

    accessCode: {
        get: function () {
            if (this.templateObjects.accessCodeField) {
                return this.templateObjects.accessCodeField.accessCode;
            }
        }
    },

    classroomId: {
        value: null
    },

    errorMessage: {
        value: null
    },

    _connectionAttempts: {
        value: 0
    },

    _hasClassRooms: {
        value: function () {
            return this.classrooms && this.classrooms.length > 0;
        }
    },

    handleJoinClassAction: {
        value: function () {
            if (this.accessCode) {
                var self = this,
                    templateObjects = this.templateObjects;

                templateObjects.joinClass.enabled = false;
                templateObjects.exitJoinClass.enabled = false;
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

                this.application.classroomJoinerService.joinUsingAccessCode(this.accessCode)
                    .catch(function(err) {
                        if (err.cause == 'invalidCode') {
                            self.templateObjects.accessCodeField.isInvalid = true;
                            self.application.classroomJoinerService.endJoiningProcess();
                        } else {
                            if (self._connectionAttempts++ < 5) {
                                self.handleJoinClassAction();
                            } else {
                                location.reload();
                            }
                        }
                    }).finally(function () {
                        templateObjects.joinClass.enabled = true;
                        templateObjects.exitJoinClass.enabled = true;
                    });
            }
        }
    },

    handleExitJoinClassAction: {
        value: function () {
            if (this._hasClassRooms()) {
                this.application.state = this.application.states.enterClass;
            }
            this.templateObjects.accessCodeField.isInvalid = false;
        }
    }

});


JoinClass.prototype.handleAccessCodeFieldAction = JoinClass.prototype.handleJoinClassAction;
JoinClass.prototype.handleAccessCodeFieldExit = JoinClass.prototype.handleExitJoinClassAction;
