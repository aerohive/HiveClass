/**
 * @module ui/new-student-modal.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class NewStudentModal
 * @extends Component
 */
exports.NewStudentModal = Component.specialize(/** @lends NewStudentModal# */ {

    daStudents: {
        value: []
    },

    isEmailAlreadyUsed: {
        value: false
    },

    handleAddStudentAction: {
        value: function(){
            this.templateObjects.modal.show();
        }
    },

    handleCloseModalAction: {
    	value: function(){
    		this._clearFields();
    		this.templateObjects.modal.hide();
    	}
    },

    handleNewStudentButtonAction: {
    	value: function () {
            if (this._registerStudent()) {
                this.templateObjects.modal.hide();
            }
        }
    },

    handleAddAdditionalStudentButtonAction: {
    	value: function () {
            this._registerStudent();
    	}
    },

    _registerStudent: {
        value: function () {
            var email = this._formatTextFieldValue(this.templateObjects.newEmailField.value),
                firstName = this._formatTextFieldValue(this.templateObjects.firstNameField.value),
                lastName = this._formatTextFieldValue(this.templateObjects.lastNameField.value);

            if (!this.application.classroomService._isStudentRegistered(email)) {
                this.application.classroomService.registerStudent(firstName, lastName, email);

                this._clearFields();

                this.application.analyticsService.trackEvent({
                    'eventCategory': 'button',
                    'eventAction': 'click',
                    'eventLabel': 'Added student',
                    'screenName': 'Dashboard'
                });

                return true;
            } else {
                this.isEmailAlreadyUsed = true;

                return false;
            }
        }
    },

    _formatTextFieldValue: {
        value: function (string) {
            var formattedString;

            if (typeof string === "string") {
                formattedString = string.trim();
            }

            return formattedString;
        }
    },

    _clearFields: {
        value: function () {
            this.templateObjects.firstNameField.value = null;
            this.templateObjects.lastNameField.value = null;
            this.templateObjects.newEmailField.value = null;
        }
    },

    enterDocument: {
        value: function () {
            this.application.analyticsService.trackView({
                'screenName': "Add Student"
            });
        }
    },

    _hasWhiteSpace: {
        value: function (string) {
            return string.indexOf(' ') >= 0;
        }
    },

    _isEmailValid: {
        value: function (string) {
            return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(string);
        }
    },

    didChange: {
        value: function (textFieldComponent) {
            if (textFieldComponent && textFieldComponent.value) {
                var string = textFieldComponent.value,
                    templateObjects = this.templateObjects;

                if (templateObjects.newEmailField === textFieldComponent) {
                    textFieldComponent.isInvalid = this._hasWhiteSpace(string) || !this._isEmailValid(string);
                }
            }

            this.isEmailAlreadyUsed = false;
        }
    }

});
