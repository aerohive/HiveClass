/**
 * @module ui/button.reel
 * @requires montage/ui/component
 */
var AbstractButton = require("montage/ui/base/abstract-button").AbstractButton;

/**
 * @class Button
 * @extends Component
 */
exports.Button = AbstractButton.specialize( /** @lends Button# */ {

    hasTemplate: {value: false}

});

