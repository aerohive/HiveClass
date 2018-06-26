/**
 @module native-menu
 @requires montage/core/core
 @requires montage/core/promise
 @requires montage/core/event/mutable-event
 @requires montage/core/event/event-manager
 */

var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    MenuItemModule = require("./menu-item");

var kListenerError = "'menuAction' listener must be installed on a component or the Application object";

var Menu = exports.Menu = Montage.specialize({

    constructor: {
        value: function Menu() {
            this.super();

            this._items = [];
        }
    },

    reset: {
        value: function(menu) {
            this.dispatchBeforeOwnPropertyChange("items", this._items);
            this._items = [];
            this.dispatchOwnPropertyChange("items", this._items);
            return Promise.resolve();
        }
    },

    _items: {
        value: null
    },

    items: {
        get: function() {
            return this._items;
        }
    },

    insertItem: {
        value: function(item, index) {
            if (!index || index > this.items.length) {
                this.items.push(item);
            } else {
                this.items.set(index, item);
            }

            return Promise.resolve(item);
        }
    },

    removeItem: {
        value: function(item) {
            var deferredRemove = Promise.defer();

            var index = this.items.indexOf(item);

            if (index > -1) {
                index.splice(index, 1);
                deferredRemove.resolve(item);
            } else {
                deferredRemove.reject(new Error("Cannot remove item that is not in this menu"));
            }

            return deferredRemove.promise;
        }
    },

    menuItemForIdentifier: {
        value: function(identifier) {
            var searchItemsTree = function(menu, identifier) {
                var iItem,
                    i;

                if (menu && menu.items) {
                    for (i = 0; (iItem = menu.items[i]); i++) {
                        if (iItem.identifier === identifier) {
                            return iItem;
                        } else {
                            if (iItem.items) {
                                iItem = searchItemsTree(iItem, identifier);
                                if (iItem) {
                                    return iItem;
                                }
                            }
                        }
                    }
                }

                return;
            };

            return searchItemsTree(this, identifier);
        }
    },

    addEventListener: {
        value: function() {
            throw new Error("addEventListener not supported. " + kListenerError);
        }
    },

    removeEventListener: {
        value: function() {
            throw new Error("removeEventListener not supported. " + kListenerError);
        }
    }

});
var _defaultMenu = null;
var _userMenu = null;

var makeMenuItem = exports.makeMenuItem = function (title, identifier, enabled, keyEquivalent, items) {
    var menuItem = new MenuItemModule.MenuItem();

    menuItem.title = title;
    menuItem.identifier = identifier;
    menuItem.enabled = enabled;
    menuItem.keyEquivalent = keyEquivalent;
    if (items) {
        menuItem.items = items;
    }

    return menuItem;
};

Montage.defineProperty(exports, "defaultMenu", {
    get: function() {
        if (!_defaultMenu) {
            _defaultMenu = new Menu();

            //TODO clean up this whole initialization
            Promise.nextTick(function () {
                var projectMenu,
                    editMenu,
                    viewMenu,
                    helpMenu,
                    fileMenu,
                    gotoMenu,
                    newSubMenu;

                // Project
                projectMenu = makeMenuItem("Project", "project", true, "", [
                    makeMenuItem("GitHub Repository", "source", true, ""),
                    makeMenuItem("Close Project", "closeProject", true, "control+q")
                ]);
                _defaultMenu.insertItem(projectMenu);

                 // File
                newSubMenu = makeMenuItem("New", "new", true, "", [
                    makeMenuItem("Component…", "newComponent", true, "shift+control+n"),
                    makeMenuItem("Module…", "newModule", true, "")
                ]);
                fileMenu = makeMenuItem("File", "file", true, "", [
                    newSubMenu,
                    makeMenuItem("Save All", "save", true, "command+s"),
                    makeMenuItem("Close File", "closeFile", true, "control+w")
                ]);
                _defaultMenu.insertItem(fileMenu);

                // Edit
                editMenu = makeMenuItem("Edit", "", true, "", [
                    makeMenuItem("Undo", "undo", false, "control+z"),
                    makeMenuItem("Redo", "redo", false, "control+shift+z"),
                    makeMenuItem("Delete", "delete", false, "command+backspace")
                ]);
                _defaultMenu.insertItem(editMenu);

                // View
                viewMenu = makeMenuItem("View", "", true, "", [
                    makeMenuItem("Live View", "launchPreview", true, "control+r")
                ]);
                _defaultMenu.insertItem(viewMenu);

                // Goto
                gotoMenu = makeMenuItem("Go", "", true, "", [
                    makeMenuItem("Go to Anything…", "goto", true, "command+e"),
                    makeMenuItem("Go to Anything Again…", "gotoAgain", true, "command+shift+e"),
                    makeMenuItem("Select Next Tab", "selectNextDocument", true, "control+option+right"),
                    makeMenuItem("Select Previous Tab", "selectPreviousDocument", true, "control+option+left")
                ]);
                _defaultMenu.insertItem(gotoMenu);

                //TODO remove featureFlag check in the future
                if (localStorage && JSON.parse(localStorage.getItem("previewControlPanel"))) {
                    viewMenu.insertItem(makeMenuItem("Manage Previews", "preview", true, "control+m"));
                }

                // Help
                helpMenu = makeMenuItem("Help", "", true, "", [
                    makeMenuItem("Documentation", "documentation", true, ""),
                    makeMenuItem("Forum", "forum", true, ""),
                    makeMenuItem("Report a Bug", "report", true, ""),
                    makeMenuItem("API Reference", "api", true, ""),
                    makeMenuItem("Framework", "framework", true, ""),
                    makeMenuItem("Show licenses…", "licenses", true, "")
                ]);
                _defaultMenu.insertItem(helpMenu);
            });
        }
        return _defaultMenu;
    }
});

Montage.defineProperty(exports, "userMenu", {
    get: function() {
        if (!_userMenu) {
            _userMenu = new Menu();
            var userMenuItem = makeMenuItem("", "", true, "", [
                    makeMenuItem("Log Out", "logout", true, "")
                ]);

            _userMenu.insertItem(userMenuItem);
        }
        return _userMenu;
    }
});
