/**
 * @module ./reporting-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target;

/**
 * @class ReportingService
 * @extends Montage
 */
exports.ReportingService = Target.specialize(/** @lends ReportingService# */ {


    convertTime: {
        value: function (time) {
            var timearray = time.split(':'),
                hour = timearray[0] % 24;
                minutes = timearray[1].length == 1 ? ':0' + timearray[1] : ':' + timearray[1];


               if (!hour) {
                return "12" + minutes + " AM";
                }
                if (hour < 12) {
                return hour + minutes + " AM";
                }
                if (hour == 12) {
                return "12" + minutes + " PM";
                }
                return (hour - 12) + minutes + " PM";
        }
    }

    

});
