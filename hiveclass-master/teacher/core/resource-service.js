/**
 * @module ./resource-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target,
    Promise = require('montage/core/promise').Promise;

/**
 * @class ResourceService
 * @extends Target
 */
exports.ResourceService = Target.specialize(/** @lends ResourceService# */ {
    _extensionService: {
        value: null
    },

    _rendezvousService: {
        value: null
    },

    _type: {
        value: 'resource'
    },

    resources: {
        value: {}
    },

    constructor: {
        value: function(extensionService, rendezvousService) {
            this._extensionService = extensionService;
            this._rendezvousService = rendezvousService;
            var self = this;
            var message = {cmd: 'get', type: 'configuration', data: 'resourcesRoot'};
            this._extensionService.send('storage', message)
                .then(function(transaction) {
                    if (transaction.response.data && transaction.response.data.value) {
                        self._resourceRoot = transaction.response.data.value;
                    } else {
                        var message = {cmd: 'initializeFolder'};
                        self._extensionService.send('bookmark', message)
                            .then(function(transaction) {
                                self._resourceRoot = transaction.response.data;
                                var message = {cmd: 'save', type: 'configuration', data: {key: 'resourcesRoot', value: self._resourceRoot}};
                                self._extensionService.send('storage', message);
                            });
                    }
                });
        }
    },

    listBookmarksFolders: {
        value: function() {
            var message = {cmd: 'listFolders'};
            return this._extensionService.send('bookmark', message)
                .then(function(transaction) {
                    return transaction.response.data;
                });
        }
    },

    loadResources: {
        value: function(folderId) {
            folderId = folderId || this._resourceRoot;
            var self = this,
                message = {cmd: 'getBookmarks', folderId: folderId};
            return this._extensionService.send('bookmark', message)
                .then(function(transaction) {
                    self.resources = transaction.response.data;
                });

        }
    },

    _removeChildrenWithoutStatus: {
        value: function _removeInactiveResources(resource, status) {
            if (resource.children) {
                for (var i = resource.children.length - 1; i >= 0; i--) {
                    var child = resource.children[i];
                    if (child[status]) {
                        continue;
                    }
                    var filteredResource = _removeInactiveResources(child, status);
                    if (!filteredResource || (filteredResource.children && filteredResource.children.length === 0)) {
                        resource.children.splice(i, 1);
                    }
                }
            } else if (!resource[status]) {
                resource = null;
            }
            return resource;
        }
    },

    _cloneResource: {
        value: function _cloneResource(resource) {
            var clone = {};
            clone.id = resource.id;
            clone.title = resource.title;
            clone.url = resource.url;
            clone.isActive = resource.isActive;
            clone.isFocused = resource.isFocused;
            if (resource.children) {
                clone.children = resource.children.map(_cloneResource);
            }
            return clone;
        }
    },

    getActiveResources: {
        value: function() {
            return this._removeChildrenWithoutStatus(this._cloneResource(this.resources), 'isActive');
        }
    },

    getFocusedResources: {
        value: function() {
            return this._removeChildrenWithoutStatus(this._cloneResource(this.resources), 'isFocused');
        }
    }
});
