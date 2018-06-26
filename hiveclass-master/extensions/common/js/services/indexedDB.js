define(['bluebird'], function(Promise) {
    var READ_WRITE = 'readwrite',
        READ_ONLY = 'readonly';

    var DBService = function(name) {
        this.version = 1;
        this._name = name;
        this.repositories = {};
    };

    DBService.prototype = Object.create(Object.prototype, {
        _init: {
            value: function () {
                var self = this;
                return new Promise(function (resolve, reject) {
                    var dbOpenRequest = indexedDB.open(self._name, self.version);

                    dbOpenRequest.onsuccess = function () {
                        self._openingDb = null;
                        self.db = dbOpenRequest.result;
                        resolve(self);
                    };

                    dbOpenRequest.onerror = function () {
                        self._openingDb = null;
                        if (dbOpenRequest.error.name === 'VersionError') {
                            self.version++;
                            self._init()
                                .then(function() {
                                    resolve(self);
                                });
                        }
                    };
                });
            }
        },

        _areAllObjectStoresCreated: {
            value: function(configurations) {
                for (var i = 0; i < configurations.length; i++) {
                    if (!this.db.objectStoreNames.contains(configurations[i].name)) {
                        return false;
                    }
                }
                return true;
            }
        },

        _isObjectStoreUpdateNeeded: {
            value: function(configurations) {
                if (configurations.length > 0 && this._areAllObjectStoresCreated(configurations)) {
                    var transaction = this.db.transaction(this.db.objectStoreNames, READ_ONLY);
                    for (var i = 0; i < configurations.length; i++) {
                        var configuration = objectsStoresConfigurations[i];
                        var objectStore = transaction.objectStore(configuration.name);
                        if (objectStore.keyPath != configuration.keyPath) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },

        addObjectStores: {
            value: function (objectsStoresConfigurations) {
                var self = this;
                return this._init()
                    .then(function () {
                        return new Promise(function (resolve) {
                            var isObjectStoreUpdateNeeded = false;
                            var areAllObjectStoresCreated = self._areAllObjectStoresCreated(objectsStoresConfigurations);
                            if (areAllObjectStoresCreated) {
                                var transaction = self.db.transaction(self.db.objectStoreNames, READ_ONLY);
                                for (var i = 0; i < objectsStoresConfigurations.length; i++) {
                                    var configuration = objectsStoresConfigurations[i];
                                    var objectStore = transaction.objectStore(configuration.name);
                                    console.log(configuration, objectStore)
                                    if (objectStore.keyPath != configuration.keyPath) {
                                        isObjectStoreUpdateNeeded = true;
                                        break;
                                    }
                                }
                            }
                            if (areAllObjectStoresCreated &&! isObjectStoreUpdateNeeded) {
                                for (var i = 0; i < objectsStoresConfigurations.length; i++) {
                                    var configuration = objectsStoresConfigurations[i];
                                    self.repositories[configuration.name] = new ObjectStoreService(self.db, configuration.name);
                                }
                                resolve(self.repositories);
                            } else {
                                self.db.close();
                                self.version++;
                                var dbOpenRequest = indexedDB.open(self._name, self.version);

                                dbOpenRequest.onupgradeneeded = function () {
                                    var db = event.target.result;

                                    for (var i = 0; i < objectsStoresConfigurations.length; i++) {
                                        var objectStore,
                                            configuration = objectsStoresConfigurations[i];
                                        if (db.objectStoreNames.contains(configuration.name)) {
                                            var transaction = event.target.transaction;
                                            objectStore = transaction.objectStore(configuration.name);
                                        } else {
                                            objectStore = db.createObjectStore(configuration.name, {keyPath: configuration.keyPath});
                                        }
                                        if (!objectStore.indexNames.contains(configuration.keyPath)) {
                                            objectStore.createIndex(configuration.keyPath, configuration.keyPath, {unique: true});
                                        }
                                        if (objectStore.keyPath != configuration.keyPath) {
                                            var cursorRequest = objectStore.openCursor();

                                            cursorRequest.onsuccess = (function(name, keyPath) {
                                                return function() {
                                                    var cursor = cursorRequest.result;
                                                    var documents = [];
                                                    if (cursor) {
                                                        documents.push(cursor.value);
                                                        cursor.continue();
                                                    } else {
                                                        db.deleteObjectStore(name);
                                                        objectStore = db.createObjectStore(name, {keyPath: keyPath});
                                                        for (var j = 0; j < documents.length; j++) {
                                                            objectStore.add(documents[j]);
                                                        }
                                                    }
                                                }
                                            })(configuration.name, configuration.keyPath);
                                        }
                                    }
                                };

                                dbOpenRequest.onsuccess = function () {
                                    self.db = dbOpenRequest.result;
                                    for (var i = 0; i < objectsStoresConfigurations.length; i++) {
                                        var configuration = objectsStoresConfigurations[i];
                                        self.repositories[configuration.name] = new ObjectStoreService(self.db, configuration.name);
                                    }
                                    resolve(self.repositories);
                                };

                                dbOpenRequest.onerror = function () {
                                    if (dbOpenRequest.error.name === 'VersionError') {
                                        self.version++;
                                        self._init();
                                    }
                                };
                            }
                        });

                    });
            }
        }
    });

    var ObjectStoreService = function(db, objectStoreName) {
        this.db = db;
        this.objectStoreName = objectStoreName;
    };

    ObjectStoreService.prototype = Object.create(Object.prototype, {

        create: {
            value: function create(data) {
                var self = this;
                return new Promise(function(resolve, reject) {
                    var transaction = self.db.transaction([self.objectStoreName], READ_WRITE);
                    var objectStore = transaction.objectStore(self.objectStoreName);
                    var request = objectStore.add(data);
                    request.onsuccess = function() {
                        resolve(request.result);
                    };

                    request.onerror = function(err) {
                        reject(err);
                    };
                });
            }
        },

        get: {
            value: function get(key) {
                var self = this;
                return new Promise(function(resolve, reject) {
                    var transaction = self.db.transaction([self.objectStoreName], READ_ONLY);
                    var objectStore = transaction.objectStore(self.objectStoreName);
                    var request = objectStore.get(key);
                    request.onsuccess = function() {
                        resolve(request.result);
                    };

                    request.onerror = function(err) {
                        reject(err);
                    };
                });
            }
        },

        update: {
            value: function update(data) {
                var self = this;
                return new Promise(function(resolve, reject) {
                    var transaction = self.db.transaction([self.objectStoreName], READ_WRITE);
                    var objectStore = transaction.objectStore(self.objectStoreName);
                    var request = objectStore.put(data);
                    request.onsuccess = function() {
                        resolve(request.result);
                    };

                    request.onerror = function(err) {
                        reject(err);
                    };
                });
            }
        },

        delete: {
            value: function _delete(key) {
                var self = this;
                return new Promise(function(resolve, reject) {
                    var transaction = self.db.transaction([self.objectStoreName], READ_WRITE);
                    var objectStore = transaction.objectStore(self.objectStoreName);
                    var request = objectStore.delete(key);
                    request.onsuccess = function() {
                        resolve(request.result);
                    };

                    request.onerror = function(err) {
                        reject(err);
                    };
                });
            }
        },

        dump: {
            value: function dump() {
                var self = this;
                return new Promise(function(resolve, reject) {
                    var transaction = self.db.transaction([self.objectStoreName], READ_ONLY);
                    var objectStore = transaction.objectStore(self.objectStoreName);
                    var request = objectStore.openCursor();
                    var dump = [];
                    request.onsuccess = function() {
                        var cursor = request.result;
                        if (cursor) {
                            dump.push(cursor.value);
                            cursor.continue();
                        } else {
                            resolve(dump);
                        }
                    };

                    request.onerror = function(err) {
                        reject(err);
                    };
                });
            }
        },

        count: {
            value: function count() {
                var self = this;
                return new Promise(function(resolve, reject) {
                    var transaction = self.db.transaction([self.objectStoreName], READ_ONLY);
                    var objectStore = transaction.objectStore(self.objectStoreName);
                    var request = objectStore.index(objectStore.keyPath).count();
                    request.onsuccess = function() {
                        resolve(request.result);
                    };

                    request.onerror = function(err) {
                        reject(err);
                    };
                });
            }
        }

    });


    return DBService;
});

