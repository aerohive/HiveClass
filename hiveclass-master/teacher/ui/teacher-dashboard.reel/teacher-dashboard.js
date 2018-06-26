/**
 * @module ui/teacher-dashboard.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Application = require("montage/core/application").application;

/**
 * @class TeacherDashboard
 * @extends Component
 */
var TeacherDashboard = exports.TeacherDashboard = Component.specialize(/** @lends TeacherDashboard# */ {

    currentClass: {
        value: null
    },

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                this.currentClass = Application.classroom;
                this.currentClass.accessCode = this.currentClass.code;

                window.nativeAddEventListener("beforeunload", this);
                window.nativeAddEventListener("unload", this);
                window.nativeAddEventListener("pagehide", this);
            }

            Application.analyticsService.trackView({
                'screenName': "Dashboard"
            });

        }
    },

    handleEvent: {
        value: function (event) {
            if (event.type === "beforeunload" && Application.classroom && Application.classroom.students.length > 0 && !Application.classroomService.mustReload) {
                (event || window.event).returnValue = TeacherDashboard.RELOAD_CONFIRMATION_MESSAGE; // Gecko and Trident
                return TeacherDashboard.RELOAD_CONFIRMATION_MESSAGE; // Gecko and WebKit
            } else if ((event.type === "unload" || event.type === "pagehide")) {
                if (Application.classroomService) {
                    Application.classroomService.close();
                }
            }
        }
    }

});


TeacherDashboard.RELOAD_CONFIRMATION_MESSAGE = "Leaving this page will close the class"; //todo: example sentence.
