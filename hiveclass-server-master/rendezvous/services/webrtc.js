exports.WebrtcService = function(roomService) {
    this._roomService = roomService;

    this.sendOfferToRoomOwner = function(message, socket) {
        var self = this;
        return this._roomService.addToClients(message.data.targetRoom, message.source, socket)
            .then(function() {
                return self._roomService.getOwner(message.data.targetRoom)
            })
            .then(function(owner) {
                owner.send(JSON.stringify(message));
            });
    };

    this.sendCandidates = function(message) {
        var targetPromise;
        if (message.data.targetClient) {
            targetPromise = this._roomService.getClient(message.data.targetRoom, message.data.targetClient);
        } else {
            targetPromise = this._roomService.getOwner(message.data.targetRoom);
        }
        return targetPromise
            .then(function(target) {
                target.send(JSON.stringify(message));
            });
    };

    this.sendAnswerToClient = function(message, socket) {
        var self = this;
        return this._roomService.addToClients(message.data.targetRoom, message.source, socket)
            .then(function() {
                return self._roomService.getClient(message.data.targetRoom, message.data.targetClient)
            })
            .then(function(client) {
                client.send(JSON.stringify(message));
            });
    }
};
