/**
 * @module ./student-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target;

/**
 * @class StudentService
 * @extends Montage
 */
exports.StudentService = Target.specialize(/** @lends StudentService# */ {

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

    saveProfile: {
        value: function(profile) {
            return this._profileService.save('remote', profile);
        }
    }

});
