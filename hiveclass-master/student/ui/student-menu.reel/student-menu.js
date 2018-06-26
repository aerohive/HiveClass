/**
 * @module ui/student-menu.reel
 */
var Component = require("montage/ui/component").Component,
    Application = require("montage/core/application").application,
    PressComposer = require("montage/composer/press-composer").PressComposer,
    KeyComposer = require("montage/composer/key-composer").KeyComposer,
    defaultLocalizer = require("montage/core/localizer").defaultLocalizer,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

/**
 * @class StudentMenu
 * @extends Component
 */
exports.StudentMenu = Component.specialize(/** @lends StudentMenu# */ {

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

    handleKeyPress: {
        value: function(event) {
            if (event.identifier === "escape") {
                this._toggle();
            }
        }
    },

    handlePress: {
        value: function(event) {
            var target = event.targetElement;

            if (!this.element.contains(target)) {
                this._toggle();
            }
        }
    },

    handleStudentMenuButtonAction: {
        value: function () {
            this._toggle();
        }
    },

    handleLeaveClassAction: {
        value: function () {
            Application.classroomService.exitClass(true);

            Application.analyticsService.trackEvent({
                'eventCategory': 'button',
                'eventAction': 'click',
                'eventLabel': 'Left class',
                'screenName': 'Various'
            });

            this._toggle();
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
        value: function enterDocument(firstTime) {
            this.addPathChangeListener("selectedLanguage", this, "handleLanguageChange");

            if (firstTime) {
                this.defaultLocalizer = defaultLocalizer;
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
