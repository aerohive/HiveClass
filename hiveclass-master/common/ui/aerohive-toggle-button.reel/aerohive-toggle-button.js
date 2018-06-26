/**
 * @module ui/aerohive-button.reel
 * @requires montage/ui/component
 */
var AbstractCheckbox = require("montage/ui/base/abstract-checkbox").AbstractCheckbox;

/**
 * @class AerohiveButton
 * @extends Component
 */
exports.AerohiveToggleButton = AbstractCheckbox.specialize( /** @lends AerohiveButton# */ {


    constructor: {
        value: function AerohiveButton() {
            this.super();
            this.classList.add("AerohiveToggleButton");
        }
    },

    disableToggle: {
        value: function ( ) {
            this.toggleChecked = null;
        }
    },

    enableToggle: {
        value: function ( ){
            this.toggleChecked = function () {
                if (!this.enabled) {
                    return;
                }
                this.checked = !this.checked;
                this.dispatchActionEvent();
            }
        }
    }

});

