var RTCPeerConnection = webkitRTCPeerConnection;
var configuration = { iceServers: [] };

var RTCClient = function(rendezvousEndpoint, peerId, signalingHandlers) {
    if (!signalingHandlers && typeof peerId === 'object') {
        signalingHandlers = peerId;
        peerId = null;
    }
    this.signalingHandlers = signalingHandlers || {};
    this.peerId = peerId || Date.now() + '-' + Math.round(Math.random() * 10000);
    this.signalingConfig = {
        endpoint: rendezvousEndpoint,
        role: 'client',
        peerId: this.peerId,
        onopen: this.signalingHandlers.onopen
    };
    this.signalingService = null;

    this.peerConnection = null;
    this.dataChannel = null;

    this.messages = {};

    var self = this;

    this.start = function() {
        this.signalingConfig.onmessage = this._handleSignalingMessage;
        this.signalingService = new SignalingService(this.signalingConfig);
    };

    this.stop = function () {
        this.signalingConfig.onmessage = null;
        this.signalingService.close();
        if (this.peerConnection && this.peerConnection.signalingState != "closed") {
            this.peerConnection.close();
        }
    };

    this.joinServer = function(serverId) {
        this.serverId = serverId;
        this._createPeerConnection();
    };

    this._createPeerConnection = function () {
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        this.peerConnection = new RTCPeerConnection(configuration);
        this.peerConnection.id = peerId;

        this.peerConnection.onicecandidate = function (evt) {
            if (evt.candidate && !self.peerConnection.connectionDone) {
                self.signalingService.send({candidate: evt.candidate}, self.serverId, 'webrtc');
            }
        };

        this.peerConnection.onnegotiationneeded = function () {
            self.peerConnection.createOffer(function (offer) {
                return self.peerConnection.setLocalDescription(offer, function () {
                    self.signalingService.send({sdp: self.peerConnection.localDescription}, self.serverId, 'webrtc');
                });
            });
        };

        this.peerConnection.onaddstream = function(event) {
            if (self.onaddstream) {
                self.onaddstream(event.stream);
            }
        };

        this.peerConnection.oniceconnectionstatechange = function (event) {
            if (self.oniceconnectionstatechange) {
                self.oniceconnectionstatechange(event);
            }
        };

        this.dataChannel = this.peerConnection.createDataChannel("messagingChannel", {protocol: "tcp"});
        this.dataChannel.onopen = function () {
            if (self.onopen) {
                self.onopen();
            }
        };

        this.dataChannel.onmessage = function (event) {
            var message = self._unfragmentMessage(event.data);
            if (message) {
                message = JSON.parse(message);
                if (message.sdp) {
                    self._handleSdpMessage(message, function(data) {
                        self.sendMessage(data);
                    });
                }
                if (self.onmessage) {
                    self.onmessage(message, peerId);
                }
            }
        };

        this.dataChannel.onclose = function () {
            if (self.onclose) {
                self.onclose();
            } else {
                setTimeout(function () {
                    self.start();
                    self._createPeerConnection();
                }, 5000);
            }
        }
    };

    this._handleSdpMessage = function (data, callback) {
        console.trace('handleSdpMessage', data);
        var desc = new RTCSessionDescription(data.sdp);
        if (desc.type == "offer") {
            self.peerConnection.setRemoteDescription(desc, function () {
                self.peerConnection.createAnswer(function (answer) {
                    self.peerConnection.setLocalDescription(answer, function () {
                        callback({sdp: self.peerConnection.localDescription});
                    });
                });
            });
        } else {
            self.peerConnection.setRemoteDescription(desc);
            console.log(self.peerConnection);
        }
    };

    this._handleCandidateMessage = function (data) {
        self.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    };

    this._handleSignalingMessage = function(payload) {
        var message = JSON.parse(payload);
        if (!message.peerId || message.peerId != self.peerId) {
            var data = message.data;
            if (data) {
                if (data.sdp) {
                    self._handleSdpMessage(data, function(data) {
                        if (data) {
                            self.signalingService.send(data, self.serverId, 'webrtc');
                        }
                    });
                } else if (data.candidate) {
                    self._handleCandidateMessage(data);
                }
            }
        }
        if (self.signalingHandlers && self.signalingHandlers.onmessage && typeof self.signalingHandlers.onmessage === 'function') {
            self.signalingHandlers.onmessage(message);
        }
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

    this._makeMessage = function(payload) {
        var rawData = JSON.stringify(payload),
            id = [this.peerId, Date.now(), Math.round(Math.random() * 10000)].join('-'),
            chunks = [],
            start = 0,
            stop = 50000,
            length = rawData.length;

        while (stop < length) {
            chunks.push(JSON.stringify({
                id: id,
                seq: chunks.length,
                data: rawData.slice(start, stop)
            }));
            start = stop;
            stop += 50000;
        }
        chunks.push(JSON.stringify({
            id: id,
            seq: chunks.length,
            isLast: true,
            data: rawData.slice(start, stop)
        }));
        return chunks;
    };

    this.send = this.sendMessage = function(message) {
        var chunks = this._makeMessage(message);
        for (var i = 0; i < chunks.length; i++) {
            this.dataChannel.send(chunks[i]);
        }
    };

    this.attachStream = function(stream) {
        self.peerConnection.addStream(stream);
        self.peerConnection.createOffer(function (offer) {
            return self.peerConnection.setLocalDescription(offer, function () {
                self.signalingService.send({sdp: self.peerConnection.localDescription}, self.serverId, 'webrtc');
            });
        });
    };

    this.detachStream = function(stream) {
        self.peerConnection.removeStream(stream);
        self.peerConnection.createOffer(function (offer) {
            return self.peerConnection.setLocalDescription(offer, function () {
                self.signalingService.send({sdp: self.peerConnection.localDescription}, self.serverId, 'webrtc');
            });
        });
    };
};
