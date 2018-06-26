var RTCPeerConnection = webkitRTCPeerConnection;
var pc,
    configuration = { iceServers: [] };

var RTCServer = function(rendezvousEndpoint, peerId, signalingHandlers) {
    this.MAX_RETRIES = 3;
    this.signalingHandlers = signalingHandlers || {};
    this.peerId = peerId || Date.now() + '-' + Math.round(Math.random() * 10000);
    this.signalingConfig = {
        endpoint: rendezvousEndpoint,
        role: 'server',
        peerId: peerId,
        onopen: this.signalingHandlers.onopen
    };
    this.signalingService = null;

    this.peerConnections = {};
    this.dataChannels = {};

    this.messages = {};

    var self = this;

    this.start = function() {
        this.signalingConfig.onmessage = this._handleSignalingMessage;
        this.signalingService = new SignalingService(this.signalingConfig);
        console.log('Server started, waiting for clients.');
    };

    this.stop = function () {
        this.signalingConfig.onmessage = null;
        this.signalingService.close();
        console.log('Server stopped.');

    };

    this._createPeerConnection = function(peerId) {
        var peerConnection = new RTCPeerConnection(configuration);
        peerConnection.id = peerId;

        peerConnection.onicecandidate = function (evt) {
            if (evt.candidate) {
                self.signalingService.send({candidate: evt.candidate, remotePeerId: peerId}, self.peerId, 'webrtc');
            }
        };

        peerConnection.ondatachannel = (function(peerId) {
            return function (event) {
                var dataChannel = event.channel;

                dataChannel.onopen = function() {
                    console.log('data channel open with peer ' + peerId + '.');
                    if (typeof self.onopen === 'function') {
                        self.onopen(peerId);
                    }
                };

                dataChannel.onmessage = function(event) {
                    if (self.onmessage) {
                        var message = self._unfragmentMessage(event.data);
                        if (message) {
                            message = JSON.parse(message);
                            self.onmessage(message, peerId);
                        }
                    }
                };

                dataChannel.onclose = function () {
                    if (typeof self.onclose === 'function') {
                        self.onclose(peerId);
                    }
                };

                self.dataChannels[peerId] = dataChannel;

            };
        })(peerId);

        peerConnection.onaddstream = (function(peerId) {
            return function(event) {
                if (typeof self.onaddstream === 'function') {
                  self.onaddstream(event.stream, peerId);
                }
            };
        })(peerId);

        peerConnection.oniceconnectionstatechange = function(event) {
            if (typeof self.oniceconnectionstatechange === 'function') {
                self.oniceconnectionstatechange(event, peerId);
            }
        };

        this.peerConnections[peerId] = peerConnection;
    };

    this._unfragmentMessage = function(data) {
        var partialMessage = JSON.parse(data);
        var partId = partialMessage.id;
        var partsContainer = this.messages[partId];
        if (!partsContainer) {
            partsContainer = this.messages[partId] = {};
        }
        partsContainer[partialMessage.seq] = partialMessage.data;
        if (partialMessage.isLast) {
            partsContainer.count = partialMessage.seq + 1;
        }
        if (partsContainer.count) {
            var receivedParts = Object.keys(partsContainer)
                .filter(function (x) {
                    return !isNaN(parseInt(x));
                });
            if (receivedParts.length == partsContainer.count) {
                var message = receivedParts
                    .map(function (x) {
                        return partsContainer[x];
                    })
                    .reduce(function(a, b) {
                        return a + b;
                    }, '');
                delete this.messages[partId];
                return message;
            }
        }
    };

    this._getPeerConnection = function(peerId) {
        if (!(peerId in this.peerConnections)) {
            this._createPeerConnection(peerId);
        }
        return this.peerConnections[peerId];
    };

    this._handleSignalingMessage = function(payload) {
        var message = JSON.parse(payload);
        if (message.peerId) {

            var peerId = message.peerId;
            var peerConnection = self._getPeerConnection(peerId);
            var data = message.data;
            if (data.sdp) {
                var desc = new RTCSessionDescription(data.sdp);
                if (desc.type == "offer") {
                    peerConnection.setRemoteDescription(desc, function() {
                        peerConnection.createAnswer(function(answer) {
                            peerConnection.setLocalDescription(answer, function() {
                                self.signalingService.send({sdp: peerConnection.localDescription, remotePeerId: peerId}, self.peerId, 'webrtc');
                            });
                        });
                    });
                } else {
                    peerConnection.setRemoteDescription(desc);
                }
            } else if (data.candidate) {
                peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        }
        if (self.signalingHandlers && self.signalingHandlers.onmessage && typeof self.signalingHandlers.onmessage === 'function') {
            self.signalingHandlers.onmessage(message);
        }
    };

    this._makeMessage = function(payload) {
        var CHUNK_SIZE = 50000;
        var rawData = JSON.stringify(payload),
            id = [this.peerId, Date.now(), Math.round(Math.random() * 10000)].join('-'),
            chunks = [],
            start = 0,
            stop = CHUNK_SIZE,
            length = rawData.length;

        while (stop < length) {
            chunks.push(JSON.stringify({
                id: id,
                seq: chunks.length,
                data: rawData.slice(start, stop)
            }));
            start = stop;
            stop += CHUNK_SIZE;
        }
        chunks.push(JSON.stringify({
            id: id,
            seq: chunks.length,
            isLast: true,
            data: rawData.slice(start, stop)
        }));
        return chunks;
    };

    this.disconnect = function(peerId) {
        if (peerId) {
            this.dataChannels[peerId].close();
            this.peerConnections[peerId].close();
            delete this.dataChannels[peerId];
            delete this.peerConnections[peerId];
        } else {
            var peerIds = Object.keys(this.dataChannels);
            for (var i = 0; i< peerIds.length; i++) {
                peerId = peerIds[i];
                this.dataChannels[peerId].close();
                this.peerConnections[peerId].close();
                delete this.dataChannels[peerId];
                delete this.peerConnections[peerId];
            }
        }
    };

    this.sendMessageToClient = function(message, peerId, retries) {
        retries = retries || 0;
        var dataChannel = this.dataChannels[peerId];
        if (dataChannel) {
            var chunks = this._makeMessage(message);
            for (var i = 0; i < chunks.length; i++) {
                if (["closing", "closed"].indexOf(dataChannel.readyState) != -1) {
                    if (retries >= this.MAX_RETRIES) {
                        delete this.dataChannels[peerId];
                        break;
                    } else {
                        var self = this;
                        setTimeout(function() {
                            self.sendMessageToClient(message, peerId, ++retries);
                        }, 500);
                    }
                } else {
                    dataChannel.send(chunks[i]);
                }
            }
        }
    };

    this.broadcastMessage = function(message) {
        for (var peerId in this.dataChannels) {
            if (this.dataChannels.hasOwnProperty(peerId)) {
                this.sendMessageToClient(message, peerId);
            }
        }
    };

    this._addStreamToPeerConnection = function (stream, peerConnection) {
        peerConnection.addStream(stream);
        peerConnection.createOffer(function (offer) {
            peerConnection.setLocalDescription(offer, function () {
                self.sendMessageToClient({sdp: peerConnection.localDescription, remotePeerId: peerConnection.id}, peerConnection.id);
            });
        });
    };

    this._removeStreamToPeerConnection = function (stream, peerConnection) {
        if (stream) {
            peerConnection.removeStream(stream);
            peerConnection.createOffer(function (offer) {
                peerConnection.setLocalDescription(offer, function () {
                    self.sendMessageToClient({sdp: peerConnection.localDescription, remotePeerId: peerConnection.id}, peerConnection.id);
                });
            });
        }
    };

    this.attachStream = function(stream, peerId) {
        if (peerId) {
            this._addStreamToPeerConnection(stream, this._getPeerConnection(peerId));
        } else {
            for (peerId in this.peerConnections) {
                if (this.peerConnections.hasOwnProperty(peerId)) {
                    this._addStreamToPeerConnection(stream, this._getPeerConnection(peerId));
                }
            }
        }
    };

    this.detachStream = function(stream, peerId) {
        if (peerId) {
            this._removeStreamToPeerConnection(stream, this._getPeerConnection(peerId));
        } else {
            for (peerId in this.peerConnections) {
                if (this.peerConnections.hasOwnProperty(peerId)) {
                    this._removeStreamToPeerConnection(stream, this._getPeerConnection(peerId));
                }
            }
        }
    };

    this.lockRoom = function(id) {
        var message = {msgId: Date.now(), id: id};
        this.signalingService.send(message, id, 'lock');
        return message.msgId;
    };

    this.unlockRoom = function(id) {
        this.signalingService.init();
        var message = {msgId: Date.now(), id: id};
        this.signalingService.send(message, id, 'unlock');
        return message.msgId;
    };
};
