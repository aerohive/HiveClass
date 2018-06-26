/**
 * @module ui/viewScreens/dashboard-header.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class DashboardHeader
 * @extends Component
 */
exports.DashboardHeader = Component.specialize(/** @lends DashboardHeader# */ {

    handleCloseAction: {
        value: function() {
            this.application.state = this.application.states.dashboard;
        }
    }


});
