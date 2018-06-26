var Promise = require('bluebird');

exports.RoomRepository = function RoomRepository() {
    this._storage = {};
    this._roomIdsByCode = {};

    this.getNew = function(id, name, owner) {
        return Promise.resolve({
            id: id,
            name: name,
            owner: owner,
            clients: {}
        });
    };

    this.save = function(room) {
        this._storage[room.id] = room;
        if (room.code) {
            this._roomIdsByCode[room.code] = room.id;
        }
        return Promise.resolve(room);
    };

    this.delete = function(id) {
        var deletedRoom = this._storage[id];
        delete this._storage[id];
        return Promise.resolve(deletedRoom);
    };

    this.list = function() {
        return Promise.resolve(Object.keys(this._storage));
    };

    this.findByCode = function(code) {
        var roomId = this._roomIdsByCode[code];
        if (roomId) {
            return Promise.resolve(this._storage[roomId]);
        } else {
            var error = new Error('No such code: ' + code);
            error.cause = 'invalidCode';
            return Promise.reject(error);
        }
    };

    this.get = function(id) {
        return Promise.resolve(this._storage[id]);
    };

    this.addToClients = function(id, clientId, client) {
        this._storage[id].clients[clientId] = client;
        return Promise.resolve();
    };

    this.lock = function(id) {
        var freedCode = this._storage[id].code;
        delete this._storage[id].code;
        delete this._roomIdsByCode[freedCode];
        return Promise.resolve(freedCode);
    };

    this.unlock = function(id, code) {
        this._storage[id].code = code;
        this._roomIdsByCode[code] = id;
        return Promise.resolve(this._storage[id]);
    };
};
