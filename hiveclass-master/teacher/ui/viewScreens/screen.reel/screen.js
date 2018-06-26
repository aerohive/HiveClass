/**
 * @module ui/viewScreens/screen.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Screen
 * @extends Component
 */
exports.Screen = Component.specialize(/** @lends Screen# */ {
    zoomed: {
        value: false
    },

    tabsShown: {
        value: false
    },

    student: {
        value: null
    },

    _tabs: {
        value: null
    },

    tabs: {
        get: function() {
            return this._tabs;
        },
        set: function(tabs) {
            var tabsLength = !!tabs ? tabs.length : 0,
                sameTabs = !!this._tabs && this._tabs.length == tabsLength;
            if (sameTabs) {
                for (var i = 0; i < tabsLength; i++) {
                    if (this._tabs[i].id != tabs[i].id ||
                        this._tabs[i].title != tabs[i].title ||
                        this._tabs[i].url != tabs[i].url) {
                        sameTabs = false;
                        break;
                    }
                }
            }
            if (!sameTabs) {
                this._tabs = tabs;
                if (this.tabsShown) {
                    this.handleTabsButtonAction();
                    this.handleTabsButtonAction();
                }
            }
        }
    },

    _desktopStream: {
        value: null
    },

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

    activeButton: {
        value: null
    },

    isSingle: {
        value: null
    },

    _isPresenting: {
        value: false
    },

    didDraw: {
        value: function() {
            if (this.isSingle && this.student && this.student.email) {
                this.zoomIn();
                if (this.application.classroomService.followedStudent && ! this._isPresenting) {
                    this.presentScreen();
                }
            }
        }
    },

    exitDocument: {
        value: function() {
            if (this.student && this.student.peerId && this.application.classroomService.isStudentConnected(this.student)) {
                this.application.classroomService.pauseViewingScreen(this.student)
            }
            if (this.application.classroomService.classroom.following === 'student') {
                this.application.classroomService.stopFollowMe();
            }
            this.activeButton = null;
            this.isSingle = false;
            this.zoomOut(true);
            this._isPresenting = false;
        }
    },

    zoomIn: {
        value: function () {
            var displayedScreens = this.parentComponent.parentComponent.templateObjects.screen;
            for (var i = 0; i < displayedScreens.length; i++) {
                var _screen = displayedScreens[i];
                if (_screen != this) {
                    if (_screen.student && _screen.student.peerId) {
                        this.application.classroomService.pauseViewingScreen(_screen.student);
                    }
                }
            }
            this.element.classList.add('zoomed');
            this.zoomed = true;
            this.anyZoom = true;
        }
    },

    handleExpandAction: {
        value: function() {
            this.zoomIn();
            this.activeButton = null;
        }
    },

    zoomOut: {
        value: function (isExiting) {
            if (!isExiting) {
                var displayedScreens = this.parentComponent.parentComponent.templateObjects.screen;
                for (var i = 0; i < displayedScreens.length; i++) {
                    var _screen = displayedScreens[i];
                    if (_screen != this) {
                        _screen.element.classList.remove('hidden');
                        if (_screen.student && _screen.student.peerId && this.application.classroomService.isStudentConnected(_screen.student)) {
                            this.application.classroomService.startViewingScreen(_screen.student);
                        }
                    }
                }
            }
            this.element.classList.remove('zoomed');
            this.zoomed = false;
            this.anyZoom = false;
        }
    },

    handleContractAction: {
        value: function() {
            this.zoomOut();
            this.activeButton = null;
        }
    },

    handlePresentAction: {
        value: function() {
            if (this.application.classroomService.followedStudent) {
                var oldFollowedStudent = this.application.classroomService.followedStudent;
                this.activeButton = null;
                this.application.classroomService.stopFollowMe();
                this._isPresenting = false;
                if (oldFollowedStudent !== this.student) {
                    this.presentScreen();
                }
            } else {
                this.presentScreen();
            }
        }
    },

    handleFreezeAction: {
        value: function() {
            if (this.student.attentionOn) {
                this.application.classroomService.releaseAttention(this.student);
            } else {
                this.application.classroomService.getAttention(this.student);
            }

            this.application.analyticsService.trackEvent({
                'eventCategory': 'button',
                'eventAction': 'click',
                'eventLabel': 'Froze screen',
                'screenName': 'View Screens'
            });

            this.activeButton = this.student.attentionOn ? this.templateObjects.freeze : null;
        }
    },

    handleTabsButtonAction: {
        value: function() {
            if (this.tabsShown) {
                this.templateObjects.tabs.element.classList.add('hidden');
            } else {
                this.application.classroomService.listTabsFromStudent(this.student);
                this.templateObjects.tabs.element.classList.remove('hidden');
            }
            this.tabsShown = !this.tabsShown;

            this.activeButton = this.tabsShown ? this.templateObjects.tabsButton : null;
        }
    },

    presentScreen: {
        value: function() {
            var self = this;
            this._isPresenting = true;
            if (this.student.desktopStream) {
                this.application.classroomService.startFollowMe(this.student);

                this.application.analyticsService.trackEvent({
                    'eventCategory': 'button',
                    'eventAction': 'click',
                    'eventLabel': 'Started student presentation',
                    'screenName': 'View Screens'
                });

                this.activeButton = this.application.classroomService.followedStudent ? this.templateObjects.present : null;
            } else {
                setTimeout(function() {
                    self.presentScreen();
                }, 50);
            }
        }
    }
});

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
