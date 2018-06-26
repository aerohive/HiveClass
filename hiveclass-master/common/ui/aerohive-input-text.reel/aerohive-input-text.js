/**
 * @module ui/aerohive-input-text.reel
 * @requires montage/ui/component
 */
var AbstractTextField = require("montage/ui/base/abstract-text-field").AbstractTextField

/**
 * @class AerohiveInputText
 * @extends Component
 */
exports.AerohiveInputText = AbstractTextField.specialize(/** @lends AerohiveInputText */{

    hasTemplate: {
        value: true
    },

    _invalid: {
        value: false
    },

    isInvalid: {
        set: function (_invalid) {
            _invalid = !!_invalid;

            if (_invalid !== this._invalid) {
                this._invalid = !!_invalid;
                this.needsDraw = true;
            }
        },
        get: function () {
            return this._invalid;
        }
    },

    //fixme: bug in montageJS when typing and a class is added the caret is set to the last character,
    // given that we set each time the value even if it the same.
    draw: {
        value: function () {
            var value = this.value;

            if (value !== this.element.value) {
                if (value === null ||  typeof value === "undefined") {
                    this.element.value = "";

                } else if ( typeof value === "boolean" ||  typeof value === "object" ||  typeof value === "number") {
                    this.element.value = value.toString();

                } else {
                    this.element.value = value;
                }
            }

            if (this.placeholderValue != null) {
                this.element.setAttribute("placeholder", this.placeholderValue);
            }

            this.element.setCustomValidity(this._invalid ? 'text field not valid' : '');
        }
    }

});
