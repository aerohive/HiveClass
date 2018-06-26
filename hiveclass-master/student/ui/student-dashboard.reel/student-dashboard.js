/**
 * @module ui/student-dashboard.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

var WelcomeMessage = "You have successfully joined ";

/**
 * @class StudentDashboard
 * @extends Component
 */
var StudentDashboard = exports.StudentDashboard = Component.specialize(/** @lends StudentDashboard# */ {

    _teacher: {
        value: null
    },

    teacher: {
        get: function () {
            return this._teacher;
        },
        set: function (value) {
            this._teacher = value;

            if (this._teacher) {
                this.welcomeMessage = WelcomeMessage + this._teacher + ' class!';
            }
        }
    },

    welcomeMessage: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            //fixme: restore me for production
            window.nativeAddEventListener("beforeunload", this);
            window.nativeAddEventListener("unload", this);
            window.nativeAddEventListener("pagehide", this);

            this.application.analyticsService.trackView({
                'screenName': "Dashboard"
            });
        }
    },

    exitDocument: {
        value: function () {
            //fixme: restore me for production
            window.nativeRemoveEventListener("beforeunload", this);
            window.nativeRemoveEventListener("unload", this);
            window.nativeRemoveEventListener("pagehide", this);
        }
    },

    handleEvent: {
        value: function (event) {
            if (event.type === "beforeunload") {
                (event || window.event).returnValue = StudentDashboard.RELOAD_CONFIRMATION_MESSAGE; // Gecko and Trident
                return StudentDashboard.RELOAD_CONFIRMATION_MESSAGE; // Gecko and WebKit
            } else if ((event.type === "unload" || event.type === "pagehide")) {
                if (this.application && this.application.classroomService) {
                    this.application.classroomService.exitClass();
                }
            }
        }
    }


});

StudentDashboard.RELOAD_CONFIRMATION_MESSAGE = "Leaving this page will exit the classroom."; //todo: example sentence.
