/**
 * @module ./rendezvous-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target,
    Promise = require('montage/core/promise').Promise;

/**
 * @class RendezvousService
 * @extends Montage
 */
exports.RendezvousService = Target.specialize(/** @lends RendezvousService# */ {
    _rtcClient: {
        value: null
    },

    _endpoint: {
        value: null
    },

    _awaitingResponses: {
        value: null
    },

    _disconnectionTimeout: {
        value: null
    },

    _closeHandler: {
        value: null
    },

    constructor: {
        value: function(configuration) {
            var self = this;
            this._endpoint = configuration.rendezvousEndpoint;
            this._awaitingResponses = {};

            setInterval(function() {
                for (var msgId in self._awaitingResponses) {
                    if (self._awaitingResponses.hasOwnProperty(msgId) &&
                            (!self._awaitingResponses[msgId] || !Promise.isPending(self._awaitingResponses[msgId].promise))) {
                        delete self._awaitingResponses[msgId];
                    }
                }
            }, 10000);
        }
    },

    enterClassroomUsingAccessCode: {
        value: function(accessCode, messageHandler, closeHandler, addstreamHandler) {
            var self = this,
                deferred = Promise.defer(),
                classroom;
            this._closeHandler = closeHandler;
            if (this._disconnectionTimeout) {
                clearTimeout(this._disconnectionTimeout);
                this._disconnectionTimeout = null;
            }
            var signalingHandlers = {
                onopen: function (signalingService) {
                    signalingService.send({
                        accessCode: accessCode
                    }, null, 'join');
                },
                onmessage: function (message) {
                    if (message.type === 'wrong-code') {
                        deferred.reject({ type: 'wrong-code'});
                        self._rtcClient.stop();
                    } else if (message.type === 'classroom' &&
                        message.data && message.data.id) {
                        classroom = message.data;
                        self._rtcClient.joinServer(message.data.id);
                    }
                }
            };
            this._rtcClient = new RTCClient(this._endpoint, signalingHandlers);
            this._rtcClient.onopen = function() {
                deferred.resolve(classroom);
            };
            this._rtcClient.onmessage = function(message, peerId) {
                messageHandler(message, peerId);
            };
            this._rtcClient.onclose = function() {
                closeHandler();
            };
            this._rtcClient.oniceconnectionstatechange = this._iceconnectionstatechangeHandler;
            this._rtcClient.onaddstream = function(stream) {
                addstreamHandler(stream);
            };
            this._rtcClient.start();
            return deferred.promise;
        }
    },

    enterClassroomUsingId: {
        value: function(classroomId, messageHandler, closeHandler, addstreamHandler) {
            var self = this,
                deferred = Promise.defer();
            this._closeHandler = closeHandler;
            if (this._disconnectionTimeout) {
                clearTimeout(this._disconnectionTimeout);
                this._disconnectionTimeout = null;
            }
            var signalingHandlers = {
                onopen: function () {
                    self._rtcClient.joinServer(classroomId);
                },
                onmessage: function (message) {
                    if (message.type === 'no-such-room') {
                        self._rtcClient.stop();
                        deferred.reject({ type: 'no-such-room'});
                    } else if (message.msgId && self._awaitingResponses[message.msgId] && Promise.isPromise(self._awaitingResponses[message.msgId].promise)) {
                        self._awaitingResponses[message.msgId].resolve(message.data);
                    }
                }
            };
            this._rtcClient = new RTCClient(this._endpoint, signalingHandlers);
            this._rtcClient.onopen = function() {
                deferred.resolve(classroomId);
            };
            this._rtcClient.onmessage = function(message, peerId) {
                messageHandler(message, peerId);
            };
            this._rtcClient.onclose = function() {
                closeHandler();
            };
            this._rtcClient.oniceconnectionstatechange = this._iceconnectionstatechangeHandler;
            this._rtcClient.onaddstream = function(stream) {
                addstreamHandler(stream);
            };
            this._rtcClient.start();
            return deferred.promise;
        }
    },

    filterOpenClassrooms: {
        value: function(classrooms) {
            var self = this;
            var message = {msgId: Date.now(), classroomsId: classrooms.map(function(x) { return x.id; })};
            this._awaitingResponses[message.msgId] = Promise.defer();
            var signalingHandlers = {
                onopen: function () {
                    self._rtcClient.signalingService.send(message, null, 'filter');
                },
                onmessage: function (message) {
                    if (message.msgId && self._awaitingResponses[message.msgId] && Promise.isPromise(self._awaitingResponses[message.msgId].promise)) {
                        self._awaitingResponses[message.msgId].resolve(message.data);
                    }
                }
            };
            this._rtcClient = new RTCClient(this._endpoint, signalingHandlers);
            this._rtcClient.start();
            return this._awaitingResponses[message.msgId].promise
                .then(function(data) {
                    self._rtcClient.signalingService.close();
                    self._rtcClient = null;
                    return data.classrooms;
                });
        }
    },

    introduceToTeacher: {
        value: function(profile) {
            this._rtcClient.sendMessage({ type: 'intro', profile: profile });
        }
    },

    sendScreen: {
        value: function(screen) {
            this._rtcClient.sendMessage({ type: 'screen', image: screen });
        }
    },

    sendTabs: {
        value: function(tabs) {
            this._rtcClient.sendMessage({ type: 'tab', tabs: tabs });
        }
    },

    exitClass: {
        value: function() {
            if (this._rtcClient && this._rtcClient.dataChannel) {
                this._rtcClient.dataChannel.close();
            }
        }
    },

    attachStream: {
        value: function(stream) {
            this._rtcClient.attachStream(stream);
        }
    },

    detachStream: {
        value: function(stream) {
            this._rtcClient.detachStream(stream);
        }
    },

    _iceconnectionstatechangeHandler: {
        get: function() {
            var self = this,
                recoveryTimeout = 5000;
            return function (event) {
                var peerConnection = event.target;
                switch (peerConnection.iceConnectionState) {
                    case 'disconnected':
                        if (self._disconnectionTimeout) {
                            clearTimeout(self._disconnectionTimeout);
                        }
                        self._disconnectionTimeout = setTimeout(function () {
                            if (['disconnected', 'closed'].indexOf(peerConnection.iceConnectionState) != -1) {
                                console.log('[' + Date.now() + ']', 'Disconnected since at least ' + recoveryTimeout + 'ms, closing session.');
                                self._closeHandler();
                            }
                        }, recoveryTimeout);
                        break;
                    case 'checking':
                    case 'connected':
                    case 'completed':
                        if (self._disconnectionTimeout) {
                            clearTimeout(self._disconnectionTimeout);
                            self._disconnectionTimeout = null;
                        }
                        break;
                    case 'closed':
                        self._closeHandler();
                        break;
                }
            }
        }
    }
});
