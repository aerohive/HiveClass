/**
 * @module ui/teacher-main-action-button.reel
 */
//var Component = require("montage/ui/component").Component;
var AbstractButton = require("montage/ui/base/abstract-button").AbstractButton;

/**
 * @class TeacherMainActionButton
 * @extends Component
 */
exports.TeacherMainActionButton = AbstractButton.specialize(/** @lends TeacherMainActionButton# */ {
    iconAttribute: {
    	set: function (value) {
    		this._SVGUseElement.setAttributeNS('http://www.w3.org/1999/xlink','href', value);
    	}
    }
});
