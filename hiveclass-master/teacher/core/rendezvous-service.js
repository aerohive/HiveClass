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
    _rtcServer: {
        value: null
    },

    _endpoint: {
        value: null
    },

    _host: {
        value: null
    },

    _port: {
        value: null
    },

    _awaitingResponses: {
        value: null
    },

    constructor: {
        value: function(configuration) {
            var self = this;
            this._endpoint = configuration.presenceEndpointUrl;
            this._awaitingResponses = {};

            setInterval(function() {
                for (msgId in self._awaitingResponses) {
                    if (!self._awaitingResponses[msgId] || !Promise.isPending(self._awaitingResponses[msgId].promise)) {
                        delete self._awaitingResponses[msgId];
                    }
                }
            }, 10000);
        }
    },

    enterClassroom: {
        value: function(teacherEmail, classroomName, classroomId, messageHandler, closeHandler, addStreamhandler) {
            var self = this,
                classId = classroomId || [teacherEmail, classroomName].join('-'),
                deferred = Promise.defer(),
                signalingHandlers;

            signalingHandlers = {
                onopen: function (signalingService) {
                    signalingService.send({
                        locked: false,
                        id: classId,
                        name: classroomName,
                        teacher: self._teacherName
                    }, classId, 'open')
                },
                onmessage: function (message) {
                    if (message.type && message.type === 'classroom') {
                        deferred.resolve(message.data);
                    } else if (message.msgId && self._awaitingResponses[message.msgId] && Promise.isPromise(self._awaitingResponses[message.msgId].promise)) {
                        self._awaitingResponses[message.msgId].resolve(message.data);
                    }
                }
            };
            this._rtcServer = new RTCServer(this._endpoint, classId, signalingHandlers);
            this._rtcServer.onmessage = function(message, peerId) {
                messageHandler(message, peerId);
            };
            this._rtcServer.onclose = function(peerId) {
                closeHandler(peerId);
            };
            this._rtcServer.oniceconnectionstatechange = function(event, peerId) {
                var peerConnection = event.target;
                console.log(event.target.iceConnectionState);
                if (peerConnection.iceConnectionState === 'disconnected') {
                    setTimeout(function() {
                        if (['disconnected', 'closed'].indexOf(peerConnection.iceConnectionState) != -1) {
                            closeHandler(peerId);
                        }
                    }, 5000);
                } else if (peerConnection.iceConnectionState === 'closed') {
                    closeHandler(peerId);
                }
            };
            this._rtcServer.onaddstream = function(stream, peerId) {
                addStreamhandler(stream, peerId);
            };
            this._rtcServer.start();
            return deferred.promise;
        }
    },

    closeClassroom: {
        value: function(classroom) {
            var message = {msgId: Date.now(), id: classroom.id};
            this._rtcServer.signalingService.send(message, classroom.id, 'close');
            this._rtcServer.disconnect();
            this._rtcServer.stop();
            return new Promise.resolve();
        }
    },

    lock: {
        value: function(classroom) {
            var messageId = this._rtcServer.lockRoom(classroom.id);
            this._awaitingResponses[messageId] = Promise.defer();
            return this._awaitingResponses[messageId].promise;
        }
    },

    unlock: {
        value: function(classroom) {
            var messageId = this._rtcServer.unlockRoom(classroom.id);
            this._awaitingResponses[messageId] = Promise.defer();
            return this._awaitingResponses[messageId].promise;
        }
    },

    startViewingScreen: {
        value: function(student) {
            var message = { type: 'screen', cmd: 'start' };
            this.sendMessage(message, student.peerId);
        }
    },

    pauseViewingScreen: {
        value: function(student) {
            console.trace('pauseViewingScreen');
            var message = { type: 'screen', cmd: 'pause' };
            this.sendMessage(message, student.peerId);
        }
    },

    stopViewingScreen: {
        value: function(student) {
            var message = { type: 'screen', cmd: 'stop' };
            this.sendMessage(message, student.peerId);
        }
    },

    startFollowMe: {
        value: function(stream, url, lock, peerId) {
            this.sendMessage({ type: 'follow-me', cmd: 'start', url: url, lock: lock }, peerId);
            this.attachStream(stream, peerId);
        }
    },

    stopFollowMe: {
        value: function(stream, peerId) {
            this.sendMessage({ type: 'follow-me', cmd: 'stop' });
            this.detachStream(stream, peerId);
        }
    },

    getAttention: {
        value: function(url, peerId) {
            this.sendMessage({ type: 'attention', cmd: 'start', url: url, lock: true }, peerId);
        }
    },

    releaseAttention: {
        value: function(peerId) {
            this.sendMessage({ type: 'attention', cmd: 'stop' }, peerId);
        }
    },

    sendScreen: {
        value: function(screen, peerId) {
            this.sendMessage({ type: 'follow-me', cmd: 'show', image: screen }, peerId);
        }
    },

    updateActiveResources: {
        value: function(activeResources) {
            this.sendMessage({ type: 'resources', cmd: 'update', active: activeResources });
        }
    },

    updateFocusedResources: {
        value: function(focusedResources) {
            this.sendMessage({ type: 'resources', cmd: 'update', focused: focusedResources });
        }
    },

    sendMessage: {
        value: function(message, peerId) {
            if (peerId) {
                this._rtcServer.sendMessageToClient(message, peerId);
            } else {
                this._rtcServer.broadcastMessage(message);
            }
        }
    },

    listTabsFromStudent: {
        value: function(student) {
            this.sendMessage({ type: 'tab', cmd: 'list' }, student.peerId);
        }
    },

    closeStudentTab: {
        value: function(student, tab) {
            this.sendMessage({ type: 'tab', cmd: 'close', tabId: tab.id }, student.peerId);
        }
    },

    kickStudent: {
        value: function(student) {
            this.sendMessage({ type: 'kick' }, student.peerId);
        }
    },

    attachStream: {
        value: function(stream, peerId) {
            this._rtcServer.attachStream(stream, peerId);
        }
    },

    detachStream: {
        value: function(stream, peerId) {
            this._rtcServer.detachStream(stream, peerId);
        }
    },

    startPresenting: {
        value: function(student) {
            this.sendMessage({ type: 'presenter', cmd: 'start' }, student.peerId);
        }
    },

    stopPresenting: {
        value: function(student) {
            if (student) {
                this.sendMessage({ type: 'presenter', cmd: 'stop' }, student.peerId);
            }
        }
    }
});
