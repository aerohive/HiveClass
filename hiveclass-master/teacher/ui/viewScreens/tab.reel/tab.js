/**
 * @module viewScreens/ui/tab.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Tab
 * @extends Component
 */
exports.Tab = Component.specialize(/** @lends Tab# */ {
    handleCloseAction: {
        value: function() {
            var self = this;
            this.application.classroomService.closeStudentTab(this.student, this.tab);
            setTimeout(function() {
                self.application.classroomService.listTabsFromStudent(self.student);
            }, 100);

            this.application.analyticsService.trackEvent({
                'eventCategory': 'button',
                'eventAction': 'click',
                'eventLabel': 'Closed tab',
                'screenName': 'View Screens'
            });
        }
    }
});
