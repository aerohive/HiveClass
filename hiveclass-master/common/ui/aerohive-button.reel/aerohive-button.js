/**
 * @module ui/aerohive-button.reel
 * @requires montage/ui/component
 */
var AbstractButton = require("montage/ui/base/abstract-button").AbstractButton;

/**
 * @class AerohiveButton
 * @extends Component
 */
exports.AerohiveButton = AbstractButton.specialize( /** @lends AerohiveButton# */ {

    hasTemplate: {value: true},

    constructor: {
        value: function AerohiveButton() {
            this.super();
            this.classList.add("AerohiveButton");
        }
    },

    enterDocument: {
        value: function(firstTime) {
            this.super(firstTime);
            if (this.element && this.element.tagName === "A" && this.href) {
                this.element.setAttribute('href', this.href);
            }
        }
    }

});

