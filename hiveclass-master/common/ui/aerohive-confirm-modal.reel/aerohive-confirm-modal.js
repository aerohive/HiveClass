var KeyComposer = require("montage/composer/key-composer").KeyComposer,
    Modal = require("common/core/modal").Modal;

/**
 * @class AerohiveConfirmModal
 * @extends Modal
 *
 * @todo: probably can use some function from aerohive-modal.reel
 */
var AerohiveConfirmModal = exports.AerohiveConfirmModal = Modal.specialize(/** @lends AerohiveConfirmModal# */ {

    /**
     * Text of message to display on the confirm popup
     * @type {String}
     * @default {String} 'Are you sure?'
     */
    message: {
        value: null
    },


    /**
     * Text to display on the Valid button
     * @type {String}
     * @default {String} 'OK'
     */
    validLabel: {
        value: null
    },


    /**
     * Text to display on the Cancel button
     * @type {String}
     * @default {String} 'Cancel'
     */
    cancelLabel: {
        value: null
    },


    validCallBack: {
        value: null
    },


    cancelCallBack: {
        value: null
    },


    _keyEnterComposer: {
        value: null
    },


    enterDocument: {
        value: function(firstTime) {
            Modal.prototype.enterDocument.call(this, firstTime);

            if (firstTime) {
                this._keyEnterComposer = KeyComposer.createKey(this, "enter", "enter");
                this._keyEnterComposer.element = window;
            }
        }
    },


    handleKeyPress: {
        value: function(event) {
            if (event.identifier === "escape") {
                this.handleCancelAction(event);
            } else if (event.identifier === "enter") {
                this.handleValidAction(event);
            }
        }
    },

    /**
     * @function
     * @param {Event} event The event keyCode.
     */
    handleValidAction: {
        value: function (event) {
            if (typeof this.validCallBack === "function") {
                this._thisArg ? this.validCallBack.call(this._thisArg, event) : this.validCallBack(event);
            }

            this.hide();
        }
    },


    /**
     * @function
     * @param {Event} event The event keyCode.
     */
    handleCancelAction: {
        value: function(event) {
            if (typeof this.cancelCallBack === "function") {
                this._thisArg ? this.cancelCallBack.call(this._thisArg, event) : this.cancelCallBack(event);
            }

            this.hide();
        }
    },


    /**
     * Displays a confirm dialog with OK and Cancel buttons.
     * @function
     * @param {String|Object} msg a message to display in the dialog or options.
     * @param {Function} validCallback Function that's invoked when the user clicks OK
     * @param {Function} cancelCallback Function that's invoked if the user clicks Cancel.
     * @example
     * todo
     */
    show: {
        value: function(options, validCallBack, cancelCallBack, thisArg) {
            var wasShown = this.isShown; // will be changed by , `Modal.prototype.show.call()`

            Modal.prototype.show.call(this);

            if (!wasShown) {
                var message = AerohiveConfirmModal.DEFAULT_MESSAGE,
                    validLabel = AerohiveConfirmModal.DEFAULT_VALID_LABEL,
                    cancelLabel = AerohiveConfirmModal.DEFAULT_CANCEL_LABEL;

                if (typeof options === "string") {
                    message = options;
                } else if (typeof options === "object" && options !== null) {
                    if (typeof options.message === "string") {
                        message = options.message;
                    }

                    if (typeof options.validLabel === "string") {
                        validLabel = options.validLabel;
                    }

                    if (typeof options.cancelLabel === "string") {
                        cancelLabel = options.cancelLabel;
                    }
                } else if (typeof options === "function") {
                    thisArg = cancelCallBack;
                    cancelCallBack = validCallBack;
                    validCallBack = options;
                }

                this.message = message;
                this.validLabel = validLabel;
                this.cancelLabel = cancelLabel;
                this._thisArg = typeof thisArg === "object" && thisArg ? thisArg : null;

                this.validCallBack = validCallBack || null;
                this.cancelCallBack = cancelCallBack || null;

                this._keyEnterComposer.load();

                this._keyEnterComposer.addEventListener("keyPress", this, false);
            }
        }
    },


    hide: {
        value: function () {
            if (this.isShown) {
                this._keyEnterComposer.unload();
                this._keyEnterComposer.removeEventListener("keyPress", this, false);
            }

            Modal.prototype.hide.call(this);
        }
    }

});


AerohiveConfirmModal.DEFAULT_MESSAGE = "Are you sure?";

AerohiveConfirmModal.DEFAULT_VALID_LABEL = "OK";

AerohiveConfirmModal.DEFAULT_CANCEL_LABEL = "Cancel";
