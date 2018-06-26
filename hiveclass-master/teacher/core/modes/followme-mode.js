/**
 * @module followme-mode
 */
var AbstractMode = require('./abstract-mode').AbstractMode,
    Promise = require('montage/core/promise').Promise;
/**
 * @class FollowmeMode
 * @extends AbstractMode
 */
exports.FollowmeMode = AbstractMode.specialize(/** @lends FollowmeMode# */ {
    name: {
        value: 'followme'
    },

    onstart: {
        value: null
    },

    onstop: {
        value: null
    },

    _from: {
        value: [
            'presenter',
            'lock'
        ]
    },

    _errorMessages: {
        value: {
            focus: 'Before entering Follow Me mode, you must remove focused resources from the classroom.'
        }
    },

    _wsPresenceClient: {
        value: null
    },

    _extensionService: {
        value: null
    },

    _stream: {
        value: null
    },

    _topologyService: {
        value: null
    },

    _paths: {
        value: null
    },

    constructor: {
        value: function(wsPresenceClient, extensionService, topologyService) {
            this._wsPresenceClient = wsPresenceClient;
            this._extensionService = extensionService;
            this._topologyService = topologyService;
        }
    },

    _sendStartForwardStreamMessage: {
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
        value: function (clientId) {
            var message = {
                type: 'forwardStream',
                cmd: 'stop'
            };
            this._wsPresenceClient.sendToClients(message);
        }
    },

    _sendFollowMeMessage: {
        value: function(command) {
            var message = {
                type: 'followMe',
                cmd: command,
                lock: true
            };
            this._wsPresenceClient.sendToClients(message);
        }
    },

    _createStreamPath: {
        value: function (path) {
            var rootNode = path[0];
            if (rootNode) {
                this._wsPresenceClient.attachStreamToClient(this._stream, rootNode.split('P')[0]);
                for (var j = 0, nodesLength = path.length; j < nodesLength - 1; j++) {
                    var target = path[j + 1];
                    var source = path[j];
                    if (source && target) {
                        this._sendStartForwardStreamMessage(source, target);
                    }
                }
            }
        }
    },

    _ensureContinuousPaths: {
        value: function () {
            var self = this;
            for (var i = 0, pathsCount = this._paths.length; i < pathsCount; i++) {
                this._createStreamPath(this._paths[i].filter(function(x) { return self._topologyService.hasNode(x) }));
            }
        }
    },

    _createNewBranch: {
        value: function(pathIndex, nodeIndex) {
            var newPath = this._paths[pathIndex];
            var truncatedPath = newPath.reverse().splice(-1*nodeIndex).reverse();
            newPath.reverse();
            this._paths.pathIndex = truncatedPath;
            this._paths.push(newPath);
            this._createStreamPath(newPath);
        }
    },

    distributeStream: {
        value: function () {
            var self = this;
            this._wsPresenceClient.addEventListener("clientError", function(event) {
                var clientId = event.remoteId.split('P')[0];
                if (self._paths) {
                    for (var i = 0, pathsCount = self._paths.length; i < pathsCount; i++) {
                        var path = self._paths[i].filter(function(x) { return self._topologyService.hasNode(x) });
                        for (var j = 0, nodesCount = path.length; i < nodesCount; i++) {
                            var node = path[j];
                            if (node.split('P')[0] === clientId) {
                                self._createNewBranch(i, j);
                            }
                        }
                    }
                }
            });
            if (!this._paths) {
                this._paths = this._topologyService.getPaths();
            }
            this._ensureContinuousPaths();
        }
    },

    _start: {
        value: function (studentUrl) {
            var self = this;
            self._stream = null;
            self._studentUrl = studentUrl;
            this._extensionService.send('screen', {cmd: 'start'})
                .then(function(transaction) {
                    return new Promise.Promise(function(resolve) {
                        if (transaction.response.data) {
                            var streamId = transaction.response.data.streamId;
                            var captureWidth = Math.min(screen.width, 1920),
                                captureHeight = (captureWidth / screen.width) * screen.height;
                            navigator.webkitGetUserMedia({
                                video: {
                                    mandatory: {
                                        chromeMediaSource: 'desktop',
                                        chromeMediaSourceId: streamId,
                                        maxWidth: captureWidth,
                                        maxHeight: captureHeight,
                                        maxFrameRate: 20
                                    }
                                }
                            }, function (stream) {
                                self._stream = stream;
                                self.distributeStream();
                                self._sendFollowMeMessage('start');
                                resolve();
                            }, function (error) {
                                console.log('Cannot capture:', error);
                                alert("An error occurred while trying to share screen.");
                                resolve();
                            });
                        } else {
                            alert("An error occurred while trying to share screen.");
                            resolve();
                        }
                    });
                })
                .then(function() {
                    if (typeof self.onstart === 'function') {
                        self.onstart(self._stream);
                    }
                });
        }
    },

    _stop: {
        value: function() {
            var self = this;
            this._sendFollowMeMessage('stop');
            this._sendStopForwardStreamMessage();
            for (var i = 0, pathsCount = this._paths.length; i < pathsCount; i++) {
                var path = this._paths[i].filter(function(x) { return self._topologyService.hasNode(x) });
                if (path && path.length > 0) {
                    this._wsPresenceClient.detachStreamFromClient(this._stream, path[0].split('P')[0]);
                }
            }
            this._extensionService.send('screen', {cmd: 'stop'});
            this._paths = null;
            if (typeof this.onstop === 'function') {
                this.onstop();
            }
        }
    }
});
