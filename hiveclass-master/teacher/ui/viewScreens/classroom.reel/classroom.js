/**
 * @module ui/viewScreens/classroom.reel
 */
var Component = require("montage/ui/component").Component,
    KeyComposer = require("montage/composer/key-composer").KeyComposer,
    Bindings = require("montage/core/core").Bindings;

/**
 * @class Classroom
 * @extends Component
 */
exports.Classroom = Component.specialize(/** @lends Classroom# */ {

    student: {
        value: null
    },

    _displayPages: {
        value: []
    },

    displayPages: {
        get: function() {
            return this._displayPages;
        },
        set: function(displayPages) {
            if (displayPages && displayPages.length > 0) {
                this._displayPages = displayPages;
                if (this._isViewing) {
                    this._stopViewing();
                    this._startViewing();
                }
            } else {
                this._exitViewScreenMode();
            }
        }
    },

    _keyComposer: {
        value: null
    },

    _page: {
        value: null
    },

    page: {
        get: function() {
            return this._page;
        },
        set: function(value) {
            if (this._isViewing) {
                this._stopViewing();
            }
            this._page = value;
            this._startViewing();
        }
    },

    __isViewing: {
        value: null
    },

    enterDocument: {
        value: function(firstTime) {
            this.application.viewScreenService.enterViewScreen(this.student);
            if (firstTime) {
                Bindings.defineBinding(this, 'displayPages', {'<-': 'this.application.viewScreenService.displayPages'});
                document.addEventListener('keyup', this._getHandler(), false);

            }
            this.page = 0;
        }
    },

    exitDocument: {
        value: function() {
            if (this.student) {
                this.application.classroomService.viewedStudent = null;
            }
            this._isViewing = false;
            this.application.viewScreenService.exitViewScreen();
        }
    },

    _exitViewScreenMode: {
        value: function() {
            this.application.state = this.application.states.dashboard;
        }
    },

    _getHandler: {
        value: function() {
            var self = this;
            return function(event) {
                switch (event.keyCode) {
                    case 37:
                        if (self.page > 0) {
                            self.page--;
                        }
                        break;
                    case 39:
                        if (self.page < self.displayPages.length-1) {
                            self.page++;
                        }
                        break;
                }
            }
        }
    },

    handlePreviousAction: {
        value: function() {
            if (this.page > 0) {
                this.page--;
            } else {
                this.page = this.displayPages.length-1;
            }
        }
    },

    handleNextAction: {
        value: function() {
            if (this.page < this.displayPages.length-1) {
                this.page++;
            } else {
                this.page = 0;
            }
        }
    },

    _startViewing: {
        value: function() {
            this.application.viewScreenService.startViewing(this.page);
            this._isViewing = true;
        }
    },

    _stopViewing: {
        value: function() {
            this.application.viewScreenService.stopViewing(this.page);
            this._isViewing = false;
        }
    }
});
