var MongoClient = require('mongodb').MongoClient,
    path = require('path'),
    Promise = require('bluebird');

exports.DbStorageService = function(dbUrl) {
    var self = this;

    MongoClient.connect(dbUrl)
        .then(function(db) {
            self._db = db;
        });

    this.saveJsonFile = function(userId, filename, data) {
        var collection = this._db.collection(userId),
            filePath = path.join(userId, filename);
        return collection.updateOne({ name: filename }, { name: filename, content: JSON.parse(JSON.stringify(data)) },{ upsert: true })
            .then(function() {
                return filePath;
            });
    };

    this.getJsonFile = function(userId, filename) {
        var collection = this._db.collection(userId);
        return collection.find({ name: filename }).limit(1).next();
    };

    return this;
};