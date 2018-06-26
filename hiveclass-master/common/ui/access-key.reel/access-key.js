/**
 * @module ui/access-key.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    KeyComposer = require("montage/composer/key-composer").KeyComposer;

/**
 * @class AccessKey
 * @extends Component
 */
exports.AccessKey = Component.specialize(/** @lends AccessKey# */ {

    _accessCode: {
        value: null
    },

    accessCode: {
        set: function (code) {
            if (this.isReadOnly) {
                this._accessCode = code;

                if (code && this._digitRepetition) {
                    this._updateDigits();
                }
            }
        },
        get: function () {
            if (this.isReadOnly) {
                return this._accessCode;
            }

            return this._getAccessKey();
        }
    },

    _isAccessCodeValid: {
        value: false
    },

    isAccessCodeValid: {
        set: function (bool) {
            bool = !!bool;

            if (bool !== this._isAccessCodeValid) {
                this._isAccessCodeValid = bool;
                this.isInvalid = false;

                this._updateState();
            }
        },
        get: function () {
            return this._isAccessCodeValid;
        }
    },

    _isInvalid: {
        value: false
    },

    isInvalid: {
        set: function (bool) {
            bool = !!bool;

            if (bool !== this._isInvalid) {
                this._isInvalid = bool;

                if (bool) {
                    this._isAccessCodeValid = false;
                }

                this._updateState();
            }
        },
        get: function () {
            return this._isInvalid;
        }
    },

    _isListening: {
        value: false
    },

    _isReadOnly: {
        value: false
    },

    isReadOnly: {
        set: function (bool) {
            bool = !!bool;

            if (bool !== this._isReadOnly) {
                this._isReadOnly = bool;

                if (bool) {
                    this._removeListeners();
                } else {
                    this._addListeners();
                }

                this._updateState();
            }
        },
        get: function () {
            return this._isReadOnly;
        }
    },

    digitCount: {
        value: 4
    },


    _digitComponentMap: {
        value: null
    },


    digitComponentMap: {
        get: function () {
            if (!this._digitComponentMap) {
                this._digitComponentMap = this._findDigitComponentMap();
            }

            return this._digitComponentMap;
        }
    },

	enterDocument: {
		value: function(firstTime){
            if (firstTime) {
                this._keyEscapeComposer = KeyComposer.createKey(this, "escape", "escape");
                this._keyEscapeComposer.element = window;

                this._keyDeleteComposer = KeyComposer.createKey(this, "backspace", "backspace");
                this._keyEnterComposer = KeyComposer.createKey(this, "enter", "enter");
                this._keyLeftComposer = KeyComposer.createKey(this, "left", "left");
                this._keyRightComposer = KeyComposer.createKey(this, "right", "right");
                this._keyUpComposer = KeyComposer.createKey(this, "up", "up");
                this._keyDownComposer = KeyComposer.createKey(this, "down", "down");
            }

            if (!this.isReadOnly) {
                this._addListeners();
            }

            this.isAccessCodeValid = false;
        }
	},

    exitDocument: {
        value: function () {
            if (!this.isReadOnly) {
                this._removeListeners();
            }
        }
    },

    handleKeyPress: {
        value: function(event) {
            if (event.identifier === "escape" && this.application.state) {
                this.isInvalid = false;
                this.dispatchEventNamed("exit", true, true);

            } else if (this._currentDigitField && event.identifier === "backspace") {
                event.preventDefault();
                this._currentDigitField.value = "";
                this.isAccessCodeValid = false;

            } else if (this._currentDigitField && (event.identifier === "right" || event.identifier === "left")) {
                this._moveFocus(event.identifier === "left");

            } else if (this._currentDigitField && (event.identifier === "up" || event.identifier === "down")) {
                this._changeValueCurrentDigit(event.identifier === "down");
                this.isAccessCodeValid = this._isAccessKeyValid();

            } else if (event.identifier === "enter" && this._isAccessKeyValid()) {
                if (this._currentDigitField) {
                    this._currentDigitField.element.blur();
                }

                this.dispatchEventNamed("action", true, true, this.accessCode);
            }
        }
    },

    captureKeyup: {
        value: function (event) {
            if (this._currentDigitField && this._isKeyCodeNumber(event.keyCode)) {
                this._currentDigitField.value = String.fromCharCode(event.keyCode);

                this.isAccessCodeValid = this._isAccessKeyValid();

                if (!this.isAccessCodeValid || this._currentDigitField.index < this.digitCount - 1) {
                    this._moveFocus();
                } else if (this._currentDigitField.index === this.digitCount - 1) {
                    //this._currentDigitField.element.blur(); //todo: need discussion
                }
            }
        }
    },

    handleFocusin: {
        value: function (event) {
            var targetElement = event.target;

            if (targetElement && targetElement.component instanceof DigitTextField) {
                this._currentDigitField = targetElement.component;
            }
        }
    },

    handleFocusout: {
        value: function () {
            this._currentDigitField = null;
        }
    },

    _addListeners: {
        value: function () {
            if (!this._isListening) {
                this._keyEscapeComposer.addEventListener("keyPress", this, false);
                this._keyEnterComposer.addEventListener("keyPress", this, false);
                this._keyDeleteComposer.addEventListener("keyPress", this, false);
                this._keyRightComposer.addEventListener("keyPress", this, false);
                this._keyLeftComposer.addEventListener("keyPress", this, false);
                this._keyUpComposer.addEventListener("keyPress", this, false);
                this._keyDownComposer.addEventListener("keyPress", this, false);

                this._keyEscapeComposer.load();
                this._keyEnterComposer.load();
                this._keyDeleteComposer.load();
                this._keyLeftComposer.load();
                this._keyRightComposer.load();
                this._keyUpComposer.load();
                this._keyDownComposer.load();

                this.element.addEventListener("focusin", this, false);
                this.element.addEventListener("focusout", this, false);
                this.element.addEventListener("keyup", this, true);

                this._isListening = true;
            }
        }
    },

    _removeListeners: {
        value: function () {
            if (this._isListening) {
                this._keyEscapeComposer.removeEventListener("keyPress", this, false);
                this._keyEnterComposer.removeEventListener("keyPress", this, false);
                this._keyDeleteComposer.removeEventListener("keyPress", this, false);
                this._keyRightComposer.removeEventListener("keyPress", this, false);
                this._keyLeftComposer.removeEventListener("keyPress", this, false);
                this._keyUpComposer.removeEventListener("keyPress", this, false);
                this._keyDownComposer.removeEventListener("keyPress", this, false);

                this._keyEscapeComposer.unload();
                this._keyEnterComposer.unload();
                this._keyDeleteComposer.unload();
                this._keyLeftComposer.unload();
                this._keyRightComposer.unload();
                this._keyUpComposer.unload();
                this._keyDownComposer.unload();

                this.element.removeEventListener("focusin", this, false);
                this.element.removeEventListener("focusout", this, false);
                this.element.removeEventListener("keyup", this, true);

                this._isListening = false;
            }
        }
    },

    _findDigitComponentMap: {
        value: function () {
            var iterations = this._digitRepetition.iterations,
                map = Object.create(null),
                childComponents,
                j, len,
                i, length;

            for (i = 0, length = iterations.length; i < length; i++) {
                childComponents = iterations[i]._childComponents;

                for (j = 0, len = childComponents.length; j < length; j++) {
                    if (childComponents[j] instanceof DigitTextField) {
                        map[i] = childComponents[j];
                        break;
                    }
                }
            }

            return map;
        }
    },


    _isAccessKeyValid: {
        value: function () {
            var digitComponentMap = this.digitComponentMap,
                isValid = true;

            for (var key in digitComponentMap) {
                if (!digitComponentMap[key].isValid()) {
                    isValid = false;
                    break;
                }
            }

            return isValid;
        }
    },

    _getAccessKey: {
        value: function () {
            if (this._digitRepetition) { // safer
                var digitComponentMap = this.digitComponentMap,
                    accessKey = "";

                for (var key in digitComponentMap) {
                    accessKey += digitComponentMap[key].value;
                }

                return accessKey;
            }
        }
    },

    _moveFocus: {
        value: function (left) {
            var currentIndex = this._currentDigitField.index;

            var newDigitComponent,
                index;

            if (!left) {
                index = currentIndex < this.digitCount - 1 ? currentIndex + 1 : 0;
            } else {
                index = currentIndex > 0 ? currentIndex - 1 : this.digitCount - 1;
            }

            newDigitComponent = this.digitComponentMap[index];

            if (newDigitComponent) {
                newDigitComponent.element.focus();
            }
        }
    },

    _updateState: {
        value: function () {
            this.state = this._isReadOnly ? 'lock' : this._isInvalid ? 'error' : this.isAccessCodeValid ? 'valid' : '';
        }
    },

    _isKeyCodeNumber: {
        value: function (keyCode) {
            return (keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105);
        }
    },

    _updateDigits: {
        value: function () {
            var digitComponentMap = this.digitComponentMap;

            for (var key in digitComponentMap) {
                digitComponentMap[key].needsDraw = true;
            }
        }
    },

    _changeValueCurrentDigit: {
        value: function (dec) {
            var value = +this._currentDigitField.value;

            if (dec) {
                value = value > 0 ? --value : 9;
            } else {
                value = value < 9 ? ++value : 0;
            }

            this._currentDigitField.value = value;
        }
    },

    handleUnlockButtonAction: {
        value: function () {
            this.application.classroom.lock = true;

            this.application.analyticsService.trackEvent({
                'eventCategory': 'toggle',
                'eventAction': 'toggle',
                'eventLabel': 'Changed class lock status',
                'screenName': 'Dashboard'
            });
        }
    }

});


var DigitTextField = exports.DigitTextField = Component.specialize(/** @lends DigitTextField# */{

    hasTemplate: {
        value: false
    },

    _needFocus: {
        value: false
    },

    _value: {
        value: null
    },

    value: {
        set: function (value) {
            if (this._value !== value) {
                this._value = value;

                this.needsDraw = true;
            }
        },
        get: function () {
            return this._value;
        }
    },

    enterDocument: {
        value: function () {
            this._needFocus = !this.index;
            this._value = null;
        }
    },

    isValid: {
        value: function () {
            return (typeof this._value === "string" && !isNaN(this._value)) || typeof this._value === "number";
        }
    },

    controller: {
        get: function () {
            return this.parentComponent.parentComponent;
        }
    },

    draw: {
        value: function () {
            if (this.controller.isReadOnly) {
                if (this.controller.accessCode) {
                    this._value = this.controller.accessCode[this.index];
                }
                this.element.removeAttribute("tabindex");

            } else {
                this.element.setAttribute("tabindex", 0);

                if (this._needFocus) {
                    this.element.focus();
                }
            }

            this._needFocus = false;

            if (this._value === void 0 || this._value === null) {
                this.element.textContent = "";
            } else {
                this.element.textContent = this._value;
            }
        }
    }

});
