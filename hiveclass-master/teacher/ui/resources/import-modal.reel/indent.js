var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.Indent = Montage.create(Component, {

    hasTemplate: { value: false },

    constructor: {
        value: function Indent() {
            this.super();
            this.depth = null;
        }
    },

    canDraw: {
        value: function () {
            return this.depth !== null;
        }
    },

    handleDepthChange: {
        value: function () {
            this.needsDraw = true;
        }
    },

    _iteration: {
        value: null
    },

    iteration: {
        get: function() {
            return this._iteration;
        },
        set: function(value) {
            if (this._iteration !== value) {
                this._iteration = value;
                this.depth = value && value.depth;
                this.needsDraw = true;
            }
        }
    },

    depth: {
        value: 0
    },

    object: {
        value: null
    },

    indentValue: {
        value: 20
    },

    indentUnit: {
        value: "px"
    },

    ignoreRoot: {
        value: false
    },

    draw: {
        value: function () {
            var depth = (this.ignoreRoot)? this.depth - 0 : this.depth;
            this.element.style.paddingLeft = (this.indentValue * depth) + this.indentUnit;
        }
    }

});
