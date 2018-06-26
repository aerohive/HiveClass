var Promise = require('bluebird');

exports.RoomService = function RoomService(roomRepository, codeRepository) {
    this._roomRepository = roomRepository;
    this._codeRepository = codeRepository;
    this.create = function(data, owner) {
        var self = this,
            createdRoom;

        owner.on('close', function() {
            self.close(data.id);
        });

        return this._roomRepository.getNew(data.id, data.name, owner)
            .then(function(room) {
                createdRoom = room;
                return self._codeRepository.getNew(4);
            })
            .then(function(code) {
                createdRoom.code = code;
                return self._roomRepository.save(createdRoom);
            })
            .then(function(room) {
                return self._roomToResponse(room);
            });
    };

    this.lock = function(roomId) {
        var self = this;
        return this._roomRepository.lock(roomId)
            .then(function(code) {
                return self._codeRepository.release(code);
            });
    };

    this.unlock = function(roomId) {
        var self = this;
        return this._codeRepository.getNew(4)
            .then(function(code) {
                return self._roomRepository.unlock(roomId, code);
            })
            .then(function(room) {
                return self._roomToResponse(room);
            });
    };

    this.listRooms = function() {
        return this._roomRepository.list()
            .then(function(roomIds) {
                return { roomIds: roomIds };
            });
    };

    this.findRoomByCode = function(code) {
        var self = this;
        return this._roomRepository.findByCode(code)
            .then(function(room) {
                return self._roomToResponse(room);
            });
    };

    this.addToClients = function(id, clientId, client) {
        return this._roomRepository.addToClients(id, clientId, client);
    };

    this.getOwner = function(id) {
        return this._roomRepository.get(id)
            .then(function(room) {
                return room.owner;
            });
    };

    this.getClient = function(roomId, clientId) {
        return this._roomRepository.get(roomId)
            .then(function(room) {
                return room.clients[clientId];
            })
    };

    this.get = function(id) {
        var self = this;
        return this._roomRepository.get(id)
            .then(function(room) {
                return self._roomToResponse(room);
            });
    };

    this.close = function(id) {
        var self = this;
        return this._roomRepository.delete(id)
            .then(function(room) {
                return self._roomToResponse(room);
            });
    };

    this._roomToResponse = function(room) {
        var response = null;
        if (room) {
            response = {
                id: room.id,
                code: room.code,
                name: room.name
            };
        }
        return response;
    };
};