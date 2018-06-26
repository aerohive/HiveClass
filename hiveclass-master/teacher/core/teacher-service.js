/**
 * @module ./teacher-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target;

/**
 * @class TeacherService
 * @extends Montage
 */
exports.TeacherService = Target.specialize(/** @lends TeacherService# */ {

    _profileService: {
        value: null
    },

    constructor: {
        value: function(profileService) {
            this._profileService = profileService;
        }
    },

    getProfile: {
        value: function() {
            return this._profileService.getProfile();
        }
    },

    setTeacherName: {
        value: function(teacherName) {
            var self = this;
            return this._profileService.getProfile()
                .then(function(profile) {
                    profile.usageName = teacherName;
                    self._profileService.update('remote', profile);
                    return profile;
                });
        }
    },

    saveProfile: {
        value: function(profile) {
            return this._profileService.save('remote', profile);
        }
    }

});
