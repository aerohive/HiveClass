/**
 * @module ui/viewScreens/dashboard.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Dashboard
 * @extends Component
 */
exports.Dashboard = Component.specialize(/** @lends Dashboard# */ {
    enterDocument: {
        value: function () {
            this.application.analyticsService.trackView({
                'screenName': "View Screens"
            });
        }
    }
});
