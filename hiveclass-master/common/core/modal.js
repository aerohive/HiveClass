/**
 * @module ui/modal.reel
 */
var Component = require("montage/ui/component").Component,
    PressComposer = require("montage/composer/press-composer").PressComposer,
    KeyComposer = require("montage/composer/key-composer").KeyComposer,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;


/**
 * @class Modal
 */
exports.Modal = Component.specialize(/** @lends Modal# */ {


    isShown: {
        value: false
    },


    _hasBackDrop: {
        value: true
    },


    hasBackDrop: {
        set: function (hasBackDrop) {
            hasBackDrop = !!hasBackDrop;

            if (hasBackDrop !== this._hasBackDrop) {
                this._hasBackDrop = hasBackDrop;

                if (hasBackDrop) {
                    this.classList.add("hasBackDrop");
                } else {
                    this.classList.remove("hasBackDrop");
                }
            }
        },
        get: function () {
            return this._hasBackDrop;
        }
    },


    _confirmModalElement: {
        value: null
    },


    /**
     * Dispatched when the user dismiss the overlay by clicking outside of it.
     * @event dismiss
     * @memberof Overlay
     * @param {Event} event
     */

    _pressComposer: {
        value: null
    },


    _keyEscapeComposer: {
        value: null
    },


    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                if (this._hasBackDrop) {
                    this.classList.add("hasBackDrop");
                }

                // Need to move the element to be a child of the document to
                // escape possible offset parent container.
                var body = this.element.ownerDocument.body;
                body.appendChild(this.element);

                this._pressComposer = new PressComposer();

                // The composers are only loaded when the modal is shown.
                // This is because the composers are added to the document, and so
                // interferes with the default actions of all clicks by calling
                // preventDefault on click when the pointer is surrendered (which
                // is whenever the modal isn't shown).
                this._pressComposer.lazyLoad = true;

                this.addComposerForElement(this._pressComposer, this.element.ownerDocument);

                this._keyEscapeComposer = KeyComposer.createKey(this, "escape", "escape");
                this._keyEscapeComposer.element = window;
            }
        }
    },


    handleKeyPress: {
        value: function(event) {
            if (event.identifier === "escape") {
                this.handleEscapeKey(event);
            }
        }
    },

    /**
     * @function
     */
    handleEscapeKey: {
        value: function () {
            this.hide();
        }
    },


    handlePressStart: {
        value: function(event) {
            if (!this.element.contains(event.targetElement)) {
                this.hide();
            }
        }
    },


    show: {
        value: function () {
            if (!this.isShown) {
                this._previousActiveTarget = defaultEventManager.activeTarget;
                defaultEventManager.activeTarget = this;

                if (defaultEventManager.activeTarget !== this) {
                    console.warn("Modal " + this.identifier + " can't become the active target because ", defaultEventManager.activeTarget, " didn't surrender it.");
                    return;
                }

                this._pressComposer.load();
                this._keyEscapeComposer.load();

                this._keyEscapeComposer.addEventListener("keyPress", this, false);
                this._pressComposer.addEventListener("pressStart", this, false);

                this.attachToParentComponent();

                this.element.classList.add("isVisible");
                this.isShown = true;
            }
        }
    },


    hide: {
        value: function () {
            if (this.isShown) {
                defaultEventManager.activeTarget = this._previousActiveTarget;

                this._pressComposer.unload();
                this._keyEscapeComposer.unload();

                this._keyEscapeComposer.removeEventListener("keyPress", this, false);
                this._pressComposer.removeEventListener("pressStart", this, false);

                this.element.classList.remove("isVisible");
                this.isShown = false;
            }
        }
    },


    didDraw: {
        value: function() {
            if (!this.isShown) {
                this.detachFromParentComponent();
            }
        }
    }

});