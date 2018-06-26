/**
 * @module presenter-mode
 */
var AbstractMode = require('./abstract-mode').AbstractMode;
/**
 * @class PresenterMode
 * @extends AbstractMode
 */
exports.PresenterMode = AbstractMode.specialize(/** @lends PresenterMode# */ {
    name: {
        value: 'presenter'
    },

    onstop: {
        value: null
    },

    _from: {
        value: []

    },

    _errorMessages: {
        value: {
            focus: "Before presenting a student's screen to the classroom, you must remove focused resources from the classroom.",
            followme: "Before presenting a student's screen to the classroom, you must exit Follow Me mode.",
            lock: "Please unlock all students before presenting a student's screen to the classroom."
        }
    },

    _presentingStudent: {
        value: null
    },

    _rendezvousService: {
        value: null
    },

    constructor: {
        value: function(wsPresenceClient, topologyService) {
            this._wsPresenceClient = wsPresenceClient;
            this._topologyService = topologyService;
        }
    },

    _sendForwardStreamMessage: {
        value: function (sourceId, targetId) {
            var message = {
                type: 'forwardStream',
                cmd: 'start',
                data: {
                    target: targetId
                }
            };
            this._wsPresenceClient.sendToClient(message, sourceId);
        }
    },

    _sendStopForwardStreamMessage: {
        value: function () {
            var message = {
                type: 'forwardStream',
                cmd: 'stop'
            };
            this._wsPresenceClient.sendToClients(message);
        }
    },

    _ensureContinuousPaths: {
        value: function () {
            var self = this;
            for (var i = 0, pathsCount = this._paths.length; i < pathsCount; i++) {
                var path = this._paths[i].filter(function(x) { return self._topologyService.hasNode(x) && x.split('P')[0] != self._presentingStudent.peerId  });
                var rootNode = path[0];
                if (rootNode) {
                    this._wsPresenceClient.attachStreamToClient(this._stream, rootNode.split('P')[0]);
                    for (var j = 0, nodesLength = path.length; j < nodesLength - 1; j++) {
                        var target = path[j + 1];
                        var source = path[j];
                        if (source && target) {
                            this._sendForwardStreamMessage(source, target);
                        }
                    }
                }
            }
        }
    },

    distributeStream: {
        value: function () {
            if (!this._paths) {
                this._paths = this._topologyService.getPaths();
            }
            this._ensureContinuousPaths();
        }
    },

    _start: {
        value: function(stream, student, students, studentUrl) {
            var self = this;
            this._presentingStudent = student;
            this._stream = stream;
            this._students = students;

            var presenterMessage = {
                type: 'presenter',
                cmd: 'start'
            };
            this._wsPresenceClient.sendToClient(presenterMessage, student.peerId);

            var message = {
                    type: 'followMe',
                    cmd: 'start',
                    data: {
                        url: studentUrl
                    }
                };
            for (var i = 0; i < students.length; i++) {
                var destinationStudent = students[i];
                if (destinationStudent !== student) {
                    this._wsPresenceClient.sendToClient(message, destinationStudent.peerId);
                }
            }

            setTimeout(function() {
                self.distributeStream();
            }, 100);
        }
    },

    _stop: {
        value: function(student) {
            this._paths = null;
            student = student || this._presentingStudent;
            var message = {
                type: 'followMe',
                cmd: 'stop'
            };
            for (var i = 0; i < this._students.length; i++) {
                var destinationStudent = this._students[i];
                if (destinationStudent !== student) {
                    this._wsPresenceClient.sendToClient(message, destinationStudent.peerId);
                    this._wsPresenceClient.detachStreamFromClient(this._stream, destinationStudent.peerId);
                    this._sendStopForwardStreamMessage();
                }
            }
            var presenterMessage = {
                type: 'presenter',
                cmd: 'stop'
            };
            this._wsPresenceClient.sendToClient(presenterMessage, student.peerId);
            if (typeof this.onstop === 'function') {
                this.onstop();
            }
        }
    }
});
