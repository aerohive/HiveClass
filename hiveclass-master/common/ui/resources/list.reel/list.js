/**
 * @module ui/resources/list.reel
 */
var Component = require("montage/ui/component").Component,
    Promise = require('montage/core/promise').Promise;

/**
 * @class List
 * @extends Component
 */
exports.List = Component.specialize(/** @lends List# */ {

    _SELECTED: {
        get: function() {
            return "selected";
        }
    },

    _UNSELECTED: {
        get: function() {
            return "unselected";
        }
    },

    _SUBSELECTED: {
        get: function() {
            return "subselected";
        }
    },

    classroom: {
        value: null
    },

    isResourceFocused: {
        value: false
    },

    _readOnly: {
        value: false
    },

    readOnly: {
        get: function () {
            return this._readOnly;
        },
        set: function (value) {
            if (this._readOnly !== value) {
                this._readOnly = value;
                if (value) {
                    this.classList.add("ResourcesList-isReadOnly");
                } else {
                    this.classList.remove("ResourcesList-isReadOnly");
                }
            }
        }
    },

    _resources: {
        value: null
    },

    resources: {
        get: function() {
            return this._resources;
        },
        set: function(value) {
            this._resources = value;
            this.needsDraw = true;
        }
    },

    resourcesUrls: {
        value: {
            isActive: [],
            isFocused: []
        }
    },

    activeResources: {
        value: []
    },

    focusedResources: {
        value: []
    },

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                if (!this.readOnly) {
                    this._refreshResources();
                }
            }

            if (!this.readOnly) {
                if (!this.application.classroomService.classroom.focusedResources || this.application.classroomService.classroom.focusedResources.children.length == 0) {
                    this.unFocusAllResources();
                }
            }
        }
    },

    handleRefreshResourcesAction: {
        value: function() {
            this._refreshResources();
        }
    },

    _addActiveAndFocusedToResourcesNode: {
        value: function (node) {
            var i;

            if (node.url) {
                node.isActive = this.resourcesUrls.isActive.indexOf(node.url) !== -1;
                node.isFocused = this.resourcesUrls.isFocused.indexOf(node.url) !== -1;
            }
            if (node.children) {
                for (i = 0; i < node.children.length; i++) {
                    this._addActiveAndFocusedToResourcesNode(node.children[i]);
                }
            }
        }
    },

    _updateActiveStatus: {
        value: function (node) {
            var status,
                selected = 0,
                subselected = 0,
                i;

            if (!node.url) {
                if (node.children) {
                    for (i = 0; i < node.children.length; i++) {
                        status = this._updateActiveStatus(node.children[i]);
                        if (status !== this._UNSELECTED) {
                            if (status === this._SELECTED) {
                                selected++;
                            } else {
                                subselected++;
                            }
                        }
                    }
                    if (selected === node.children.length) {
                        return node.activeStatus = this._SELECTED;
                    }
                    if (selected + subselected) {
                        return node.activeStatus = this._SUBSELECTED;
                    }
                    return node.activeStatus = this._UNSELECTED;
                }
            }
            if (node.isActive) {
                return node.activeStatus = this._SELECTED;
            }
            return node.activeStatus = this._UNSELECTED;
        }
    },

    updateActiveStatus: {
        value: function () {
            if (this.resources) {
                this._updateActiveStatus(this.resources);
            }
        }
    },

    _updateFocusStatus: {
        value: function (node) {
            if (!node.url) {
                if (node.children) {
                    for (var i = 0; i < node.children.length; i++) {
                        this._updateFocusStatus(node.children[i]);
                    }
                }
            }
            if (node.isFocused) {
                this.isResourceFocused = true;
                return node.focusStatus = this._SELECTED;
            }
            return node.focusStatus = this._UNSELECTED;
        }
    },

    updateFocusStatus: {
        value: function () {
            if (this.resources) {
                this.isResourceFocused = false;
                this._updateFocusStatus(this.resources);
            }
        }
    },

    unFocusAllResources: {
        value: function() {
            if (this.resources) {
                this._unFocusChildren(this.resources);
            }
        }
    },

    _unFocusChildren: {
        value: function(rootNode) {
            for (var i = 0; i < rootNode.children.length; i++) {
                var child = rootNode.children[i];
                if (child.url) {
                    child.isFocused = false;
                    child.focusStatus = this._UNSELECTED;
                } else {
                    this._unFocusChildren(child);
                }
            }
        }
    },

    _loadClassroom: {
        value: function(classroomId) {
            var self = this;

            this.application.classroomService.get(classroomId)
                .then(function(classroom) {
                    self.classroom = classroom;
                    self.resourcesUrls = {
                        isActive: self._extractChildrenUrls(classroom.activeResources, []),
                        isFocused: self._extractChildrenUrls(classroom.focusedResources, [])
                    };
                    if (self.resources) {
                        self._addActiveAndFocusedToResourcesNode(self.resources);
                        self.updateActiveStatus();
                        self.updateFocusStatus();
                    }
                    self.needsDraw = true;
                }).done();
        }
    },

    _extractChildrenUrls: {
        value: function _extractChildrenUrls(resource, urls) {
            if (resource) {
                if (resource.url) {
                    urls.push(resource.url);
                } else if (resource.children) {
                    for (var i = 0; i < resource.children.length; i++) {
                        _extractChildrenUrls(resource.children[i], urls);
                    }
                }
            }
            return urls;
        }
    },

    _refreshResources: {
        value: function() {
            var self = this;

            this.application.resourceService.loadResources()
                .then(function() {
                    self._loadClassroom(self.application.classroomService.classroom.id);
                });
        }
    }
});
