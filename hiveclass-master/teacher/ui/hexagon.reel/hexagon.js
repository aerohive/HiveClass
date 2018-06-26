/**
 * @module ui/hexagon.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Hexagon
 * @extends Component
 */
var Hexagon = exports.Hexagon = Component.specialize(/** @lends Hexagon# */ {

    student: {
        set: function (value) {
            this._student = value;

            this.needsDraw = true;
        },
        get: function () {
            return this._student;
        }
    },

    _student: {
        value: null
    },

    _isDragged: {
        value: false
    },

    isDragged: {
        get: function() {
            return this._isDragged;
        },
        set: function(value) {
            this._isDragged = !!value;
        }
    },

    _isAvatarDisplayed: {
        value: false
    },

    isAvatarDisplayed: {
        get: function () {
            return this._isAvatarDisplayed;
        },
        set: function (value) {
            value = !!value;

            if (this._isAvatarDisplayed !== value) {
                this._isAvatarDisplayed = !!value;
                this.needsDraw = true;
            }
        }
    },

    prepareForActivationEvents: {
        value: function () {
            var self = this;

            this.element.addEventListener('dragstart', function(event) {
                self.handleDragStart(event);
            }, false);
            this.element.addEventListener('dragend', function() {
                self.isDragged = false;
            }, false);
            this.element.addEventListener('mousedown', function() {
                self.isDragged = true;
            }, false);
            this.element.addEventListener('mouseup', function() {
                self.isDragged = false;
            }, false);
        }
    },

    handleRemoveClick: {
        value: function() {
            this.application.confirmModal.templateObjects.validButton.classList.add("button--danger");

            this.application.confirmModal.show({message: "RemoveStudentWarning", validLabel: 'Delete'}, function () {
                this.application.classroomService.unRegisterStudent(this._student.email, this.connected);

                this.application.analyticsService.trackEvent({
                    'eventCategory': 'button',
                    'eventAction': 'click',
                    'eventLabel': 'Removed student',
                    'screenName': 'Dashboard'
                });

                this.application.confirmModal.templateObjects.validButton.classList.remove("button--danger");
                this.hideOverlay();

            }, function() {
                this.application.confirmModal.templateObjects.validButton.classList.remove("button--danger");

                this.hideOverlay();
            }, this);
        }
    },

    handleViewClick: {
        value: function () {
            if (this.connected) {
                this.application.classroomService.viewedStudent = this.student;
                this.application.state = this.application.states.screens;
                this.hideOverlay();
            }
        }
    },

    handleLockClick: {
        value: function () {
            if (this.connected) {
                if (this.student.attentionOn) {
                    this.application.classroomService.releaseAttention(this.student);
                } else {
                    this.application.classroomService.getAttention(this.student);
                }
            }
        }
    },

    handlePresentClick: {
        value: function () {
            if (this.connected && this.canPresent) {
                this.application.classroomService.followedStudent = this.application.classroomService.viewedStudent = this.student;
                this.application.state = this.application.states.screens;
                this.hideOverlay();
            }
        }
    },

    handleDragStart: {
        value: function (event) {
            this.overlayElement.classList.add('hidden');
            event.dataTransfer.setData('studentEmail', this.student.email);
        }
    },

    showOverlay: {
        value: function () {
            if (!this.overlayIsOpen) {
                this.hexagonNameElement.classList.add('hidden');
                this.imageElement.classList.add('hidden');
                this.overlayElement.classList.remove('hidden');

                this.overlayIsOpen = true;
            }
        }
    },

    hideOverlay: {
        value: function () {
            if (this.overlayIsOpen) {
                this.imageElement.classList.remove('hidden');
                this.overlayElement.classList.add('hidden');

                this.overlayIsOpen = false;

                if (!this.isAvatarDisplayed) {
                    this.hexagonNameElement.classList.remove('hidden');
                }
            }
        }
    },

    draw: {
        value: function () {
            if (this._student && this.isAvatarDisplayed) {
                this.hexagonNameElement.classList.add('hidden');

                this.imageElement.setAttributeNS('http://www.w3.org/1999/xlink', "xlink:href", this._student.avatar || "");
            } else {
                this.hexagonNameElement.classList.remove('hidden');
                this.imageElement.setAttributeNS('http://www.w3.org/1999/xlink', "xlink:href","");
            }
        }
    }

});


Hexagon.addAttributes({

    draggable: true


});
