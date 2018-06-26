/**
 @module native-menu
 @requires montage/core/core
 @requires montage/core/event/event-manager
 */

var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

var kListenerError = "'menuAction' listener must be installed on a component or the Application object";

exports.MenuItem = Montage.specialize({

    deserializedFromSerialization: {
        value: function() {
            if (!this.hasOwnProperty("identifier")) {
                this.identifier = Montage.getInfoForObject(this).label;
            }
        }
    },

    constructor: {
        value: function MenuItem () {
            this.super();
            this.items = [];
        }
    },

    title: {
        value: null
    },

    keyEquivalent: {
        value: ""
    },

    enabled: {
        value: true
    },

    isSeparator: {
        value: false
    },

    _menu: {
        value: null
    },

    insertItem: {
        value: function(item, index) {
            index = (typeof index === "undefined") ? this.items.length: index;
            this.items.splice(index, 0, item);

            return Promise.resolve(item);
        }
    },

    removeItem: {
        value: function(item) {
            var deferredRemove = Promise.defer(),
                index = this.items.indexOf(item);

            if (index > -1) {
                index.splice(index, 1);
                deferredRemove.resolve(item);
            } else {
                deferredRemove.reject(new Error("Cannot remove item that is not in this menu"));
            }

            return deferredRemove.promise;
        }
    },

    dispatchMenuEvent:{
        value: function(type) {
            var event = new CustomEvent(type, {
                    detail: this,
                    bubbles: true,
                    cancelable: true
                });

            defaultEventManager.activeTarget.dispatchEvent(event);

            return event.defaultPrevented;
        }
    },

    addEventListener: {
        value: function() {
            throw new Error("addEventListener not supported. " + kListenerError);
        }
    },

    removeEventListener: {
        value: function() {
            throw new Error("removeEventListener not supported. " + kListenerError);
        }
    }

});
