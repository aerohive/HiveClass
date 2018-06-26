/**
 * @module ui/aerohive-modal.reel
 */
var KeyComposer = require("montage/composer/key-composer").KeyComposer,
    Modal = require("common/core/modal").Modal;

/**
 * @class AerohiveModal
 * @extends Component
 */
exports.AerohiveModal = Modal.specialize(/** @lends AerohiveModal# */ {
    isConfirm: {
        value: false
    },

    cancelOnEscape: {
        value: true
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
            switch (event.identifier) {
                case 'enter':
                    if (this.isConfirm) {
                        this.handleValidAction(event);
                    }
                    break;
                case 'escape':
                    if (this.cancelOnEscape) {
                        this.handleCancelAction(event);
                    }
                    break;
            }
        }
    },

    show: {
        value: function() {
            var wasShown = this.isShown;

            Modal.prototype.show.call(this);

            if (!wasShown) {
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
    },

    handleValidAction: {
        value: function (event) {
            if (typeof this.validCallback === "function") {
                this.validCallback(event);
            }

            this.hide();
        }
    },

    handleCancelAction: {
        value: function(event) {
            if (typeof this.cancelCallback === "function") {
                this.cancelCallback(event);
            }

            this.hide();
        }
    }
});
