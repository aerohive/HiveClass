/**
 * @module ui/resources/import-modal.reel
 */
var Component = require("montage/ui/component").Component,
    Resource = require('common/model/resource').Resource;

/**
 * @class ImportModal
 * @extends Component
 */
exports.ImportModal = Component.specialize(/** @lends ImportModal# */ {
    folders: {
        value: null
    },

    handleImportAction: {
        value: function(){
            var self = this;
            this.application.resourceService.listBookmarksFolders()
                .then(function(folders) {
                    self.folders = folders;
                    self.templateObjects.foldersTreeController.root.expanded = true;
                });
            this.templateObjects.importResourcesOverlay.show();
        }
    },

    handleImportResourcesButtonAction: {
        value: function() {
            var selectedElement = document.querySelector('.ImportResourcesModal-overlay .selected');
            if (selectedElement) {
                var folderId = selectedElement.component.iteration.content.id;
                this.application.resourceService.loadResources(folderId)
            }
            this.templateObjects.importResourcesOverlay.hide();
        }
    },

    handleExpandFolderAction: {
        value: function(event) {
            event.target.node.expanded = !event.target.node.expanded;
        }
    }
});
