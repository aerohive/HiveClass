/**
 * @module ui/tree-list-item.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class TreeListItem
 * @extends Component
 */
exports.TreeListItem = Component.specialize(/** @lends TreeListItem# */ {

    _iteration: {
        value: null
    },

    iteration: {
        get: function () {
            return this._iteration;
        },
        set: function (value) {
            if (this._iteration !== value) {
                this._iteration = value;
                if (value) {
                    if (value.data.url) {
                        this.classList.remove("TreeListItem-folder");
                    } else {
                        this.classList.add("TreeListItem-folder");
                    }
                    this.needsDraw = true;
                }
            }
        }
    },

    activeStatus: {
        set: function (value) {
            this.needsDraw = true;
        }
    },

    focusStatus: {
        set: function () {
            this.needsDraw = true;
        }
    },

    _setNodeActiveValueRecursively: {
        value: function (node, value) {
            var i;

            node.isActive = value;
            if (node.children) {
                for (i = 0; i < node.children.length; i++) {
                    this._setNodeActiveValueRecursively(node.children[i], value);
                }
            }
        }
    },

    _setNodeFocusValueRecursively: {
        value: function (node, value) {
            var i;

            node.isFocused = value;
            if (node.children) {
                for (i = 0; i < node.children.length; i++) {
                    this._setNodeFocusValueRecursively(node.children[i], value);
                }
            }
        }
    },

    handleActiveAction: {
        value: function () {
            var data = this._iteration.data;

            if (data.url) {
                data.isActive = !data.isActive;
            } else {
                if (data.activeStatus === this.list._UNSELECTED) {
                    this._setNodeActiveValueRecursively(data, true);
                } else {
                    this._setNodeActiveValueRecursively(data, false);
                }
            }
            this.list.updateActiveStatus();
            this.application.classroomService.setActiveResourcesInClassroom(this.application.resourceService.getActiveResources(), this.list.classroom);
            this.application.analyticsService.trackEvent({
                'eventCategory': 'toggle',
                'eventAction': 'toggle',
                'eventLabel': 'Changed resource active status',
                'screenName': 'Resources Dashboard'
            });
        }
    },

    handleFocusAction: {
        value: function () {
            var list = this.list,
                data = this._iteration.data;

            if (data.url) {
                var newFocusStatus = !data.isFocused;
                if (newFocusStatus) {
                    list.unFocusAllResources();
                }
                data.isFocused = newFocusStatus;
            }
            list.updateFocusStatus();
            this.application.classroomService.setFocusedResourcesInClassroom(this.application.resourceService.getFocusedResources(), list.classroom)
                .then(function(isSuccess) {
                    if (!isSuccess) {
                        list.unFocusAllResources();
                    }
                });
            this.application.analyticsService.trackEvent({
                'eventCategory': 'toggle',
                'eventAction': 'toggle',
                'eventLabel': 'Changed resource focus status',
                'screenName': 'Resources Dashboard'
            });
        }
    },

    _toggleExpansion: {
        value: function() {
            this._iteration.isExpanded = !this._iteration.isExpanded;
        }
    },

    handleIconAction: {
        value: function () {
            this._toggleExpansion();
        }
    },

    handleTitleAction: {
        value: function () {
            this._toggleExpansion();
        }
    },

    draw: {
        value: function () {
            var data;

            if (this._iteration) {
                data = this._iteration.data;
                this.titleElement.textContent = data.title;
                if (data.url) {
                    this.linkElement.textContent = data.url.replace(/.*?:\/\//g, "");
                    this.linkElement.href = data.url;
                }
                if (this._iteration.isExpanded) {
                    this._element.classList.add("TreeListItem-isExpanded");
                } else {
                    this._element.classList.remove("TreeListItem-isExpanded");
                }
                this.icon._element.style.marginLeft = (this._iteration.depth * 20 + 27) + "px";
                this.titleElement.style.paddingLeft = (this._iteration.depth * 20) + "px";
                this.titleElement.style.marginLeft = (-this._iteration.depth * 20) + "px";
                switch (data.activeStatus) {
                    case this.list._SELECTED:
                        this.active._element.classList.add("TreeListItem-checked");
                        this.active._element.classList.remove("TreeListItem-partial");
                    break;
                    case this.list._SUBSELECTED:
                        this.active._element.classList.remove("TreeListItem-checked");
                        this.active._element.classList.add("TreeListItem-partial");
                    break;
                    default:
                        this.active._element.classList.remove("TreeListItem-checked");
                        this.active._element.classList.remove("TreeListItem-partial");
                    break;
                }
                if (data.url) {
                    switch (data.focusStatus) {
                        case this.list._SELECTED:
                            this.focus._element.classList.add("TreeListItem-checked");
                            this.focus._element.classList.remove("TreeListItem-partial");
                            break;
                        default:
                            this.focus._element.classList.remove("TreeListItem-checked");
                            this.focus._element.classList.remove("TreeListItem-partial");
                            break;
                    }
                }
            }
        }
    }

});
