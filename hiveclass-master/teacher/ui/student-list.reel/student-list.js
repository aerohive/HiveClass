/**
 * @module ui/student-list.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Hexagon = require("ui/hexagon.reel").Hexagon,
    PressComposer = require("montage/composer/press-composer").PressComposer;


//var CLASS_UL = 'subStudentList';

/**
 * @class StudentList
 * @extends Component
 */
exports.StudentList = Component.specialize(/** @lends StudentList# */ {


    _pressComposer: {
        value: null
    },

    _addPressComposer: {
        value: function () {
            this._pressComposer = new PressComposer();
            this.addComposerForElement(this._pressComposer, this.element.ownerDocument);
            this._pressComposer.lazyLoad = true;
        }
    },

    handlePress: {
        value: function(event){
            var target = event.targetElement;

            //handles opening overlays on press
            if (this.element.contains(target)) {
                var hexagonComponent = this._findHexagonComponentWithElement(target);

                if (hexagonComponent) {
                    if (hexagonComponent.overlayIsOpen !== true && !target.classList.contains('StudentDropTarget')) {
                       this._closePreviousOpenedHexagonIfNeeded();
                        hexagonComponent.showOverlay();

                        this._previousSelectedHexagon = hexagonComponent;
                    }

                    //fixme: no need to check if the overlay was not displayed before.
                    if (hexagonComponent.overlayIsOpen === true) {
                        //try to find if an user has clicked on a button within the overlay hexagon.
                        var buttonClicked = this._findButtonWithElementAndHexagonComponent(target, hexagonComponent);

                        if (buttonClicked) {
                            //Handles buttons inside overlay
                            switch (buttonClicked) {
                                case hexagonComponent.removeButtonElement:
                                    hexagonComponent.handleRemoveClick();
                                    break;
                                case hexagonComponent.viewButtonElement:
                                    hexagonComponent.handleViewClick();
                                    break;
                                case hexagonComponent.lockButtonElement:
                                    hexagonComponent.handleLockClick();
                                    break;
                                case hexagonComponent.presentButtonElement:
                                    hexagonComponent.handlePresentClick();
                                    break;
                            }
                        }
                    }
                } else {
                    this._closePreviousOpenedHexagonIfNeeded();
                }
            } else {
                this._closePreviousOpenedHexagonIfNeeded();
            }
        }
    },

    isAnimationEnd: {
        value: true // demo fix
    },

    selectedStudent: {
        value: null
    },

    _students: {
        value: null
    },

    //fixme why we have a binding in the template connectedStudents <- students?
    students: {
        get: function() {
            return this._students;
        },
        set: function (value) {
            //fixme: can student be something else than an array?
            if (this._students && this._students.constructor === Array) {
                this._students.removeRangeChangeListener(this, 'students');
            }

            this._students = value;

            if (value && value.constructor === Array) {
                this._students.addRangeChangeListener(this, 'students');
            }

            this.needsDraw = true;
        }
    },

    handleStudentsRangeChange: {
        value: function () {
            //todo: check where students is used, could lend to some issues if these changes are not applied once the repetition has done its job.
            this.needsDraw = true;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                var self = this;
                //fixme: why a closure here? handleMoveStudent should be good enough here
                this.addEventListener('moveStudent', function(event) { self._handleMoveStudent(event); }, false);
                //fixme: these listeners should probably be removed when the component leave the DOM.
                window.addEventListener('resize', this, false);

                this._addPressComposer();
            }
        }
    },

    exitDocument: {
        value: function () {
            window.removeEventListener('resize', this, false);

            this._closePreviousOpenedHexagonIfNeeded();
        }
    },

    handleResize: {
        value: function () {
            this.needsDraw = true;
        }
    },

    _handleCompletedFirstDraw: {
        value: function (completed) {
            if (completed) {
                this.needsDraw = true;
            }
        }
    },

    _handleMoveStudent: {
        value: function(event) {
            this.application.classroomService.moveStudent(event.detail.studentEmail, event.detail.position);
            return false;
        }
    },

    _closePreviousOpenedHexagonIfNeeded: {
        value: function () {
            if (this._previousSelectedHexagon) {
                this._previousSelectedHexagon.hideOverlay();
                this._previousSelectedHexagon = null;
            }
        }
    },

    _findHexagonComponentWithElement: {
        value: function (element) {
            if (element && element !== this.element) {
                if (element.component instanceof Hexagon) {
                    return element.component;
                }

                return this._findHexagonComponentWithElement(element.parentNode);
            }

            return null;
        }
    },

    _findButtonWithElementAndHexagonComponent: {
        value: function (element, hexagonComponent) {
            if (element && element !== hexagonComponent.overlayElement) {
                if (element == hexagonComponent.removeButtonElement ||
                    element == hexagonComponent.viewButtonElement ||
                    element == hexagonComponent.lockButtonElement ||
                    element == hexagonComponent.presentButtonElement){

                    return element;
                }

                return this._findButtonWithElementAndHexagonComponent(element.parentNode, hexagonComponent);
            }

            return null;
        }
    },

    _firstLineCount: {
        value: 1
    },

    prepareForActivationEvents: {
       value: function () {
           this._pressComposer.addEventListener("press", this, false);
       }
    },

    draw: {
        value: function () {
            if (this._students) {
                var container = this.templateObjects.studentRepetition.element.parentNode,
                    count = this._students.length;

                // Count the number of students and buttons in the first row. 110 is the width of hexagon + padding.
                this._firstLineCount = Math.max(Math.min(Math.floor(container.parentNode.scrollWidth / 110), count + 1), 1);

                // Set the container size accordingly. The floats used to lay out the students and buttons together
                // cause the container width calculated during layout to be too small, so a min-width is required.
                container.style["min-width"] = (this._firstLineCount * 110) + 10 + "px";
            }
        }
    }

});
