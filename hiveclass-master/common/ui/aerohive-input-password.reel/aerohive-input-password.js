/**
 * @module ui/aerohive-input-password.reel
 * @requires montage/ui/component
 */
var AbstractTextField = require("montage/ui/base/abstract-text-field").AbstractTextField

/**
 * @class AerohiveInputPassword
 * @extends Component
 */
exports.AerohiveInputPassword = AbstractTextField.specialize( /** @lends AerohiveInputPassword# */ {

    hasTemplate: {value: true}

});
