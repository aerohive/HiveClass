var StorageService = function() {
    this._entries = [];
    this.save = function(entry) {
        this._entries.push(entry);
    };

    this.retrieve = function() {
        return this._entries;
    }
};

exports.StorageService = StorageService;