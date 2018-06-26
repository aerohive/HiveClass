/**
 * @module ui/classrooms-list.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class ClassroomsList
 * @extends Component
 */
exports.ClassroomsList = Component.specialize(/** @lends ClassroomsList# */ {
    _classroomsList: {
        value: null
    },
    classroomsList: {
        get: function() {
            return this._classroomsList;
        },
        set: function(value) {
            console.log(value);
            this._classroomsList = value;
        }
    },
    constructor: {
        value: function ClassroomsList() {
            this.super();
        }
    }
});
