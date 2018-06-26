define(['bluebird'], function(Promise) {
    var BookmarkService = function() {
        this.getBookmarks = function(folderId) {
            var self = this;
            return new Promise(function (resolve) {
                    chrome.bookmarks.getSubTree(folderId, function (bookmarks) {
                        resolve(bookmarks);
                    });
                })
                .then(function(bookmarks) {
                    return self._formatBookmarks(bookmarks[0]);
                });
        };

        this.listFolders = function() {
            var self = this;
            return new Promise(function (resolve) {
                    chrome.bookmarks.getTree(function (bookmarks) {
                        resolve(bookmarks);
                    });
                })
                .then(function(bookmarks) {
                    return self._filterFolders(bookmarks[0]);
                });
        };

        this._ensureFolderExists = function (name, parentId) {
            return new Promise(function (resolve) {
                chrome.bookmarks.search({ title: name }, function (bookmarks) {
                    var hiveSchoolBookmarks = bookmarks.filter(function (x) {
                        return x.title === name;
                    });
                    if (hiveSchoolBookmarks.length > 0) {
                        resolve(hiveSchoolBookmarks[0].id);
                    } else {
                        chrome.bookmarks.create({
                            parentId: parentId,
                            title: name,
                            index: 0
                        }, function (bookmarkTreeNode) {
                            resolve(bookmarkTreeNode.id)
                        });
                    }
                });
            });
        };

        this.initializeFolder = function() {
            return this._ensureFolderExists('HiveSchool', '1');
        };

        this.createClassroomFolder = function createClassroomFolder(name) {
            var self = this;
            return this.initializeFolder()
                .then(function(parentId) {
                    return self._ensureFolderExists(name, parentId);
                });
        };

        this._filterFolders = function(folder) {
            var result = {
                    id: folder.id,
                    title: folder.title
                },
                children = [];

            var childrenFolders = folder.children.filter(function(child) { return !child.url });
            for (var i = 0; i < childrenFolders.length; i++) {
                children.push(this._filterFolders(childrenFolders[i]));
            }
            if (children.length > 0) {
                result.children = children;
            }
            return result;
        };

        this._formatBookmarks = function(folder) {
            var result = {
                id: folder.id,
                title: folder.title,
                parentId: folder.parentId,
                children: []
            };

            var children = folder.children.filter(function(child) { return child.url || child.children.length > 0; });
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (child.url) {
                    result.children.push({
                        id: child.id,
                        title: child.title,
                        url: child.url
                    });
                } else {
                    result.children.push(this._formatBookmarks(children[i]));
                }
            }
            return result;
        };
    };

    return BookmarkService;
});
