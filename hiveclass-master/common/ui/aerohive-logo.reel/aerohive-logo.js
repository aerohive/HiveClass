/**
 * @module ui/aerohive-logo.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class AerohiveLogo
 * @extends Component
 */
exports.AerohiveLogo = Component.specialize(/** @lends AerohiveLogo# */ {
    prepareForActivationEvents: {
        value: function () {
            this.templateObjects.dynamicHeader.element.addEventListener("blur", this)
        }
    },

    _dynamicHeaderValue: {value: null},

    dynamicHeaderValue: {
        set: function (data) {
            if (this._dynamicHeaderValue !== data) {
                this._dynamicHeaderValue = data;
                sessionStorage.setItem('dynamicHeaderValue', data);                
            }
        },
        get: function () {
            return sessionStorage.getItem('dynamicHeaderValue') === undefined ?
                this._dynamicHeaderValue : sessionStorage.getItem('dynamicHeaderValue')
        }
	},
      
    handleBlur: {
        value: function (event) {
            this.dynamicHeaderValue = event.target.value
        }
    }
});
