/**
 * @module ui/resources/dashboard.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Dashboard
 * @extends Component
 */
exports.Dashboard = Component.specialize(/** @lends Dashboard# */ {
    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                //fixme: workaround for the substitution, need data logic here!
                this.application.resourceService.loadResources();
            }

            this.application.analyticsService.trackView({
                'screenName': "Resources Dashboard"
            });
        }
    }
});
