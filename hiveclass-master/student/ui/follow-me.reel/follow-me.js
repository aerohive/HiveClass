/**
 * @module ui/follow-me.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class FollowMe
 * @extends Component
 */
var FollowMe = exports.FollowMe = Component.specialize(/** @lends FollowMe# */ {
    desktopStream: {
        get: function() {
            return this._desktopStream;
        },
        set: function(desktopStream) {
            this._desktopStream = desktopStream;
            if (desktopStream) {
                this.videoSrc = window.URL.createObjectURL(desktopStream);
            }
        }
    },

    videoSrc: {
        value: null
    },

    enterDocument: {
        value: function(firstTime) {
            window.nativeAddEventListener("beforeunload", this);
            window.nativeAddEventListener("unload", this);
            window.nativeAddEventListener("pagehide", this);
        }
    },

    exitDocument: {
        value: function () {
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
                console.log(event.type, event);
                if (this.application && this.application.classroomService) {
                    this.application.classroomService.exitClass();
                }
            }
        }
    }

});
FollowMe.RELOAD_CONFIRMATION_MESSAGE = "Leaving this page will exit the classroom."; //todo: example sentence.

var DesktopVideo = exports.DesktopView = Component.specialize(/** @lends DesktopView# */{
    hasTemplate: {
        value: false
    },

    _src: {
        value: null
    },

    src: {
        get: function() {
            return this._src;
        },
        set: function(src) {
            this._src = src;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            if (this._src) {
                this.element.setAttribute('src', this._src);
                this.element.play();
            }
        }
    }
});
