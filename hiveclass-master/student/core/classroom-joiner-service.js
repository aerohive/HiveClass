/**
 * @module ./classroom-joiner-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target;

/**
 * @class ClassroomJoinerService
 * @extends Montage
 */
exports.ClassroomJoinerService = Target.specialize(/** @lends ClassroomJoinerService# */ {
    _classroomService: {
        value: null
    },

    _studentService: {
        value: null
    },

    constructor: {
        value: function(classroomService, studentService) {
            this._classroomService = classroomService;
            this._studentService = studentService;
        }
    },

    _joinClassroom: {
        value: function(rendezvousClassroom) {
            var self = this;

            this.application.analyticsService.set('dimension3', rendezvousClassroom.id);

            return Promise.all([
                this._classroomService.save(rendezvousClassroom),
                this._studentService.getProfile()
            ]).then(function(results) {
                return self._classroomService.introduceToTeacher(results[1]);
            });

        }
    },

    joinUsingId: {
        value: function(classroomId) {
            var self = this;
            return this._classroomService.enableScreenSharing()
                .then(function() {
                    return self._classroomService.joinUsingId(classroomId);
                })
                .then(function(classroom) {
                    return self._joinClassroom(classroom);
                });
        }
    },

    joinUsingAccessCode: {
        value: function(accessCode) {
            var self = this;
            return this._classroomService.enableScreenSharing()
                .then(function() {
                    return self._classroomService.joinUsingAccessCode(accessCode)
                })
                .then(function(classroom) {
                    return self._joinClassroom(classroom);
                });
        }
    },

    endJoiningProcess: {
        value: function() {
            return this._classroomService.stopSharing();
        }
    }
});
