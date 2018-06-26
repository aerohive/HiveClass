/**
 * @module ui/viewScreens/page.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Page
 * @extends Component
 */
exports.Page = Component.specialize(/** @lends Page# */ {
    draw: {
        value: function () {
            if (this.back) {
                this.element.style['z-index'] = -1 * this.index;
            } else {
                this.element.style['z-index'] = 1;
            }
        }
    }

});
