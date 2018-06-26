var MongoClient = require('mongodb').MongoClient,
    Promise = require('bluebird');

exports.WhitelistService = function(dbUrl) {
    var self = this;

    MongoClient.connect(dbUrl)
        .then(function(db) {
            self._db = db;
            self._collection = db.collection('client');
        });

    this.isDomainAuthorized = function(domain) {
        if (domain) {
            return this._collection.count({domains: domain, active: true})
                .then(function (count) {
                    return count > 0;
                });
        }
        else {
            return Promise.resolve(false);
        }
    };

    this.createClient = function(clientName) {
        if (clientName) {
            return this._collection.count({ name: clientName })
                .then(function(count) {
                    if (count > 0) {
                        return 409;
                    }
                    return self._collection.insert({ name: clientName, active: true })
                        .then(function() {
                            return 201;
                        });
                });
        } else {
            return Promise.resolve(400);
        }
    };

    this.addDomainsToClient = function(clientName, domains) {
        if (typeof domains === 'string') {
            domains = [domains];
        }
        var updatePromises = [];
        for (var i = 0, domainsLength = domains.length; i < domainsLength; i++) {
            updatePromises.push(this._collection.findOneAndUpdate({ name: clientName }, { $addToSet: { domains: domains[i] }}));
        }
        return Promise.all(updatePromises)
            .then(function() {
                return 204;
            });
    };

    this.setClientActiveStatus = function(clientName, activeStatus) {
        return this._collection.findOneAndUpdate({ name: clientName }, { $set: { active: activeStatus }})
            .then(function() {
                return 204;
            });
    };

    this.getClients = function() {
        return this._collection.find({}, { name: true }).toArray()
            .then(function(clients) {
                return clients.map(function(x) { return x.name; });
            });
    };

    this.getClient = function(clientName) {
        return this._collection.find({ name: clientName }).toArray()
            .then(function(clients) {
                return clients.map(function(x) {
                    return {
                        name: x.name,
                        domains: x.domains,
                        active: !!x.active
                    };
                })[0];
            });
    };

    return this;
};