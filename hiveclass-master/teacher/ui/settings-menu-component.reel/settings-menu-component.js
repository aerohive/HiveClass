/**
 * @module ui/settings-menu-component.reel
 */
var Component = require("montage/ui/component").Component,
    Application = require("montage/core/application").application,
    ToggleSwitch = require("digit/ui/toggle-switch.reel").ToggleSwitch,
    PressComposer = require("montage/composer/press-composer").PressComposer,
    KeyComposer = require("montage/composer/key-composer").KeyComposer,
    defaultLocalizer = require("montage/core/localizer").defaultLocalizer,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

/**
 * @class SettingsMenuComponent
 * @extends Component
 */
exports.SettingsMenuComponent = Component.specialize(/** @lends SettingsMenuComponent# */ {
    accessCode: {
        value: null
    },

    settingsMenuComponentItemsElement: {
        value: null
    },

    _isDisplayed: {
        value: false
    },

    _isFirstTimeDisplay: {
        value: true
    },

    _pressComposer: {
        value: null
    },


    _keyEscapeComposer: {
        value: null
    },

    _className: {
        value: null
    },

    className: {
        get: function () {
            return this._className;
        },
        set: function(value) {
            if (value) { //fixme: probably need some regex or checking about the className
                this._className = value;
                Application.classroomService.classroom.name = value;
                Application.classroomService.update();
            }
        }
    },

    handlePress: {
        value: function(event) {
            var target = event.targetElement;

            if (this.element.contains(target)) {
                if (target && target.tagName === "LABEL") {
                    var switchTarget = document.getElementById(target.getAttribute("for"));

                    if (switchTarget && switchTarget.component instanceof ToggleSwitch) {
                        switchTarget.component.checked = !switchTarget.component.checked;
                        switchTarget.component.dispatchActionEvent();
                    }
                }
            } else {
                this._toggle();
            }
        }
    },

    handleKeyPress: {
        value: function(event) {
            if (event.identifier === "escape") {
                this.handleEscapeKey(event);
            }
        }
    },

    /**
     * @function
     */
    handleEscapeKey: {
        value: function () {
            this._toggle();
        }
    },

    handleLockClassSwitchAction: {
        value: function () {

            var self = this;

            if (this.templateObjects.lockClassSwitch.checked) {
                Application.classroomService.lock(Application.classroom)
                    .then(function(data) {
                        Application.classroom.accessCode = null;
                        Application.classroom.lock = true;
                        console.log('lock', data);
                    });
            } else {
                Application.classroomService.unlock(Application.classroom)
                    .then(function(data) {
                        Application.classroom.accessCode = data.code;
                        Application.classroom.lock = false;
                        console.log('unlock', data);
                    });
            }

            Application.analyticsService.trackEvent({
                'eventCategory': 'toggle',
                'eventAction': 'toggle',
                'eventLabel': 'Changed class lock status',
                'screenName': 'Various'
            });
        }
    },


    handleSettingsButtonAction: {
        value: function () {
            this._toggle();
        }
    },

    handleDeleteClassAction: {
        value: function () {
            Application.confirmModal.templateObjects.validButton.classList.add("button--danger");

            var self = this;
            Application.confirmModal.show({message: "DeleteClassWarning", validLabel: 'Delete'}, function () {
                Application.confirmModal.templateObjects.validButton.classList.remove("button--danger");
                Application.classroomService.delete()
                    .then(function() {
                        Application.state = Application.states.init;
                    });

                Application.analyticsService.trackEvent({
                    'eventCategory': 'button',
                    'eventAction': 'click',
                    'eventLabel': 'Deleted class',
                    'screenName': 'Various'
                });

            }, function () {
                Application.confirmModal.templateObjects.validButton.classList.remove("button--danger");
            }, this);

            this._toggle();
        }
    },

    handleEndClassAction: {
        value: function () {
            Application.confirmModal.show({message: "EndClassWarning", validLabel: 'End Class'}, function () {
                Application.classroomService.close();
                Application.analyticsService.trackEvent({
                    'eventCategory': 'button',
                    'eventAction': 'click',
                    'eventLabel': 'Ended class',
                    'screenName': 'Various'
                });

            }, null, this);

            this._toggle();
        }
    },

    handleCloseTabsSwitchAction: {
        value: function () {
            Application.classroomService.classroom.closeTabs = this.templateObjects.closeTabsSwitch.checked;
            Application.classroomService.save();
        }
    },

    handleHelpButtonAction: {
        value: function () {
            var win = window.open('http://www.aerohive.com/330000/docs/help/english/hs/help.htm', '_blank');
            win.focus();
        }
    },

    handleFeedbackButtonAction: {
        value: function () {
            Application.state = Application.states.feedback;
        }
    },

    handleReportingButtonAction: {
        value: function () {
            Application.state = Application.states.reporting;
        }
    },

    _toggle: {
        value: function () {
            if (this._isDisplayed) {
                defaultEventManager.activeTarget = this._previousActiveTarget;

                this._pressComposer.unload();
                this._keyEscapeComposer.unload();

                this._keyEscapeComposer.removeEventListener("keyPress", this, false);
                this._pressComposer.removeEventListener("press", this, false);

                this.element.classList.remove('is-open');
                this._isDisplayed = false;

            } else {
                this._previousActiveTarget = defaultEventManager.activeTarget;
                defaultEventManager.activeTarget = this;

                if (defaultEventManager.activeTarget !== this) {
                    console.warn(this.identifier + " can't become the active target because ",
                        defaultEventManager.activeTarget, " didn't surrender it.");

                    return;
                }

                if (this._isFirstTimeDisplay) {
                    this._isFirstTimeDisplay = false;
                    this._addPressComposer();
                }

                this._pressComposer.load();
                this._keyEscapeComposer.load();

                this._keyEscapeComposer.addEventListener("keyPress", this, false);
                this._pressComposer.addEventListener("press", this, false);

                this.element.classList.add('is-open');
                this._isDisplayed = true;
            }
        }
    },

    _addPressComposer: {
        value: function () {
            this._pressComposer = new PressComposer();
            this._pressComposer.lazyLoad = true;

            this.addComposerForElement(this._pressComposer, this.element.ownerDocument);

            this._keyEscapeComposer = KeyComposer.createKey(this, "escape", "escape");
            this._keyEscapeComposer.element = window;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.defaultLocalizer = defaultLocalizer;
            }

            this.addPathChangeListener("selectedLanguage", this, "handleLanguageChange");

            if (!this.application.classroomService.classroom.registeredStudents.length > 0) {
                this._toggle();
            }
        }
    },

    selectedLanguage: {
        value: null
    },

    handleLanguageChange: {
        value: function () {

            if (this.selectedLanguage) {
                switch (this.selectedLanguage) {
                    case "English":
                        defaultLocalizer.locale = "en";
                        break;
                    case "Deutsch":
                        defaultLocalizer.locale = "de";
                        break;
                    case "Español":
                        defaultLocalizer.locale = "es";
                        break;
                    case "Suomi":
                        defaultLocalizer.locale = "fi";
                        break;
                    case "Français":
                        defaultLocalizer.locale = "fr";
                        break;
                    case "Italiano":
                        defaultLocalizer.locale = "it";
                        break;
                    case "日本語":
                        defaultLocalizer.locale = "ja";
                        break;
                    case "한국인":
                        defaultLocalizer.locale = "ko";
                        break;
                    case "Dutch":
                        defaultLocalizer.locale = "nl";
                        break;
                    case "Português":
                        defaultLocalizer.locale = "pt";
                        break;
                    case "Svenska":
                        defaultLocalizer.locale = "sv";
                        break;
                    case "简体中文":
                        defaultLocalizer.locale = "zh-Hans";
                        break;
                    case "繁體中文":
                        defaultLocalizer.locale = "zh-Hant";
                        break;
                }
                Application.analyticsService.trackEvent({
                    'eventCategory': 'drop-down',
                    'eventAction': 'select',
                    'eventLabel': 'Selected a language',
                    'screenName': 'Various',
                    'eventValue': defaultLocalizer.locale
                });
            }
        }
    }

});
