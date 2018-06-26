/**
 * @module ui/classroom-lock.reel
 * @requires montage/ui/component
 */
var AbstractCheckbox = require("montage/ui/base/abstract-checkbox").AbstractCheckbox;

/**
 * @class ClassroomLock
 * @extends Component
 */
exports.ClassroomLock = AbstractCheckbox.specialize(/** @lends ClassroomLock# */ {
	// accessCode: {
	// 	value:null
	// },

 //    handleAction: {
 //        value: function() {
 //        	// 
 //            var self = this;
 //            if (this.checked) {
 //                this.application.classroomService.lock(this.application.classroom)
 //                    .then(function(data) {
 //                        self.accessCode = null;
 //                        console.log('lock', data);
 //                    });
 //            } else {
 //                this.application.classroomService.unlock(this.application.classroom)
 //                    .then(function(data) {
 //                        self.accessCode = data.code;
 //                        console.log('unlock', data);
 //                    });
 //            }
 //        }
 //    }
});
