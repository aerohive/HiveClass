var Folder = exports.Folder = function(name, parent) {
    this.name = name;
    this.parent = parent;
    this.children = [];
};