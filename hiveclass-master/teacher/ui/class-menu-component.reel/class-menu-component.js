/**
 * @module ui/menu-component.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class ClassMenuComponent
 * @extends Component
 */
exports.ClassMenuComponent = Component.specialize(/** @lends MenuComponent# */ {
    constructor: {
        value: function ClassMenuComponent() {
            this.super();
        }
    },

    enterDocument: {
        value: function enterDocument(firstTime) {
                var self = this;
                this.application.classroomService.list()
                    .then(function(classrooms) {
                        // self.classMenu = classrooms;

                        self.classMenu = classrooms.filter(function(x) { return x.id != self.application.classroom.id; })



                    });
                this.currentClass = this.application.classroom;

        }
    },

    classMenu: {
        value: null
    },

    currentClass: {
        value: null
    },

    handleCurrentClassAction: {
        value: function (){
            this.element.children[1].classList.toggle('hidden');
            console.log(this.currentClass);
            console.log(this.classMenu);
        }
    },

    handleMenuItemAction: {
        value: function (){
            // changes to selected class
            console.log('change class');
        }
    },

    handleEndClassAction: {
        value: function (){
            // end the class
            console.log('end class');
        }
    }

    
});

