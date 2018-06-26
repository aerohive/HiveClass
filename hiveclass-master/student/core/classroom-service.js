/**
 * @module ./classroom-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target,
    Application = require("montage/core/application").application,
    Promise = require('montage/core/promise').Promise,
    ClientTopologyService = require('montage-webrtc/client-topology-service').ClientTopologyService,
    request = require('montage/core/request');

/**
 * @class ClassroomService
 * @extends Montage
 */
exports.ClassroomService = Target.specialize(/** @lends ClassroomService# */ {
    _extensionService: {
        value: null
    },

    _rendezvousService: {
        value: null
    },

    _application: {
        value: null
    },

    _loggingEndpoint: {
        value: null
    },

    _type: {
        value: 'classroom'
    },

    showCloseTabs: {
        value: false
    },

    _peerId: {
        value: null
    },

    desktopStream: {
        value: null
    },

    _followMeStream: {
        value: null
    },

    followmeStream: {
        get: function() {
            return this._followMeStream;
        },
        set: function(stream) {
            this._followMeStream = stream;
        }
    },

    _isSharingEndAuthorized: {
        value: false
    },

    _screenSharingAsked: {
        value: null
    },

    _inFollowMeMode: {
        value: false
    },

    _clientTopologyService: {
        value: null
    },

    constructor: {
        value: function(extensionService, rendezvousService, application, wsPresenceClient, rtcService, rtcPresenceClient, loggingEndpoint) {
            this._extensionService = extensionService;
            this._rendezvousService = rendezvousService;
            this._application = application;
            this._wsPresenceClient = wsPresenceClient;
            this._rtcService = this._wsPresenceClient.rtcService;
            this._rtcPresenceClient = rtcPresenceClient;
            this._loggingEndpoint = loggingEndpoint;
            this._clientTopologyService = new ClientTopologyService();

            var self = this;

            this._p2pPromise = new Promise(function(resolve) {
                self._rtcService.addEventListener('switchToP2P', function() {
                    resolve();
                });
            });

            this._wsPresenceClient.addEventListener('roomChange', function() {
                if (!self.classroom) {
                    self.listOpenClassrooms()
                        .then(function (openClassrooms) {
                            if (openClassrooms && openClassrooms.length) {
                                Application.state = Application.states.enterClass;
                            } else {
                                Application.state = Application.states.joinClass;
                            }
                        });
                }
            });

            this._rtcPresenceClient.addEventListener('addstream', function(event) {
                self._addFollowMeStream(event.stream, event.remoteId);
            });
            this._rtcPresenceClient.addEventListener('message', function(event) {
                self._handleMessage(JSON.parse(event.data));
            });
            this._rtcPresenceClient.addEventListener('ready', function() {
                self._signalReady();
            });
            this._rtcPresenceClient.addEventListener('topologyChanged', function(event) {
                if (self._inFollowMeMode && self._followmeSource) {
                    if (event.detail.topology.indexOf(self._followmeSource) != -1) {
                        self._removeOldStreamSource(event.detail.changesBefore);
                    } else {
                        self._switchingStream = true;
                        self._addNewStreamSource();
                    }
                }
            });
            this._rtcPresenceClient.addEventListener('removestream', function(event) {
                self._followMeStream = null;
                self._followmeSource = null;
                if (self._switchingStream) {
                    self._addNewStreamSource();
                }
            });
            this._rtcPresenceClient.addEventListener('connectionClose', function(event) {
                self._clientTopologyService.removePeer(event.detail);
                var message = {
                    source: self._rtcPresenceClient.id,
                    type:   'topology',
                    cmd:    'connectedPeers',
                    peers:  self._clientTopologyService.getPeers()
                };
                self._rtcService.send(message);
            });

            this._rtcService.addEventListener('message', function(event) {
                self._handleMessage(JSON.parse(event.data));
            });
            this._rtcService.addEventListener('addstream', function(event) {
                self._addFollowMeStream(event.stream, event.remoteId);
            });
            this._rtcService.addEventListener('connectionClose', function() {
                self.exitClass(false);
            });
        }
    },

    save: {
        value: function(classroom) {
            var self = this;
            this._application.classroom = classroom;
            var message = {cmd: 'get', type: this._type, data: classroom.id};
            return this._extensionService.send('storage', message)
                .then(function(transaction) {
                    var cmd = transaction.response.data && transaction.response.data ? 'update' : 'save';
                    var message = {cmd: cmd, type: self._type, data: classroom};
                    return self._extensionService.send('storage', message);
                });
        }
    },

    list: {
        value: function() {
            var message = {cmd: 'dump', type: this._type};
            return this._extensionService.send('storage', message)
                .then(function(transaction) {
                    return transaction.response.data;
                });
        }
    },

    get: {
        value: function(id) {
            var message = {cmd: 'get', type: this._type, data: id};
            return this._extensionService.send('storage', message)
                .then(function(transaction) {
                    return transaction.response.data;
                });
        }
    },

    delete: {
        value: function(classroomId) {
            classroomId = classroomId || this._application.classroom.id;
            var message = {cmd: 'delete', type: this._type, data: classroomId};
            return this._extensionService.send('storage', message);
        }
    },

    filterAvailable: {
        value: function(classrooms) {
            return this._wsPresenceClient.listOpenRooms()
                .then(function (classroomIds) {
                    return classrooms.filter(function(x) { return classroomIds.indexOf(x.id) != -1; });
                });
        }
    },

    listOpenClassrooms: {
        value: function() {
            var self = this;
            return this.list()
                .then(function (classrooms) {
                    return self.filterAvailable(classrooms);
                })
                .then(function (openClassrooms) {
                    self.openClassrooms = openClassrooms;
                    return openClassrooms;
                });
        }
    },

    joinUsingAccessCode: {
        value: function(accessCode) {
            var self = this;
            return this._wsPresenceClient.findRoomByCode(accessCode)
                .then(function(classroom) {
                    return self.joinUsingId(classroom.id);
                });
        }
    },

    joinUsingId: {
        value: function(classroomId) {
            return this._wsPresenceClient.joinRoom(classroomId)
                .then(function(classroom) {
                    return classroom;
                });
        }
    },

    stopSharing: {
        value: function () {
            if (this.desktopStream) {
                this._isSharingEndAuthorized = true;
                this.desktopStream.getTracks()[0].stop();
            }
        }
    },

    exitClass: {
        value: function(signalToTeacher) {
            this.stopSharing();
            this._extensionService.send('follow-me', {cmd: 'stop'});
            this._extensionService.send('focus', {cmd: 'stop'});
            this._extensionService.send('screen', {cmd: 'stop'});
            this._extensionService.send('tracking', {cmd: 'stop'});
            this._rtcPresenceClient.quit();
            this._rtcService.quit(signalToTeacher);
            this.classroom = null;
            this._application.state = this._application.states.enterClass;
            this.mustReload = true;
        }
    },

    closeTabs: {
        value: function() {
            return this._extensionService.send('tab', {cmd: 'closeAllExceptMe'});
        }
    },

    enableScreenSharing: {
        value: function () {
            if (this.desktopStream && this.desktopStream.active) {
                return Promise.resolve();
            }else {
                if (!this._screenSharingAsked) {
                    this._screenSharingAsked = true;
                    var self = this;
                    return this._extensionService.send('screen', {cmd: 'start'})
                        .then(function (transaction) {
                            self._screenSharingAsked = false;
                            if (transaction.response.data) {
                                var streamId = transaction.response.data.streamId;
                                return new Promise(function (resolve, reject) {
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
                                        self.desktopStream = stream;
                                        self.desktopStream.onended = function() {
                                            if (!self._isSharingEndAuthorized) {
                                                alert("Screen sharing is mandatory to stay in a classroom.");
                                                self.exitClass();
                                            }
                                        };
                                        resolve();
                                    }, function (error) {
                                        console.log('Cannot capture:', error);
                                        alert("An error occurred while sharing screen which prevents to join the classroom.");
                                        reject();
                                    });
                                });
                            } else {
                                alert("Screen sharing is mandatory to join the classroom.");
                                return Promise.reject();
                            }
                        });
                }
            }
        }
    },

    introduceToTeacher: {
        value: function(profile) {
            var message = { type: 'intro', profile: profile };
            this._rtcService.send(message);
        }
    },

    _removeOldStreamSource: {
        value: function (changesBefore) {
            if (changesBefore && !this._switchingStream && this.followmeStream) {
                this._switchingStream = true;
                this._rtcPresenceClient.detachRemoteStreams();
            }
        }
    },

    _addNewStreamSource: {
        value: function () {
            if (this._switchingStream) {
                this.followmeStream = null;
                this._askStreamToPeer(this._rtcPresenceClient.getPeerAtDistance(-1));
            }
        }
    },

    _handleMessage: {
        value: function(message) {
            var self = this;
            switch (message.type) {
                case 'classroom':
                    this.save(message.classroom);
                    this._peerId = message.peerId;
                    this._application.classroom = message.classroom;
                    this.startTracking().then(function() {
                        if (message.classroom.closeTabs) {
                            self._application.state = self._application.states.closeTabs;
                        } else {
                            self._application.state = self._application.states.dashboard;
                        }
                        self._connectToPeers();
                        var topologyMessage = {
                            source: self._rtcPresenceClient.id,
                            type:   'topology',
                            cmd:    'connectedPeers',
                            peers:  []
                        };
                        self._rtcService.send(topologyMessage);
                    });
                    break;
                case 'connection_rejected':
                    alert('This account is already connected to the classroom.');
                    this._application.connectionRefused = true;
                    this.exitClass();
                    break;
                case 'close':
                    this.exitClass();
                    break;
                case 'viewScreen':
                    this._handleViewScreenMessage(message);
                    break;
                case 'followMe':
                    this._handleFollowMeMessage(message);
                    break;
                case 'addPeer':
                    this._p2pPromise
                        .then(function() {
                            return self._rtcPresenceClient.addPeer(message.data.id);
                        })
                        .then(function(peerId) {
                            if (peerId) {
                                self._clientTopologyService.addPeer(peerId);
                                var message = {
                                    source: self._rtcPresenceClient.id,
                                    type:   'topology',
                                    cmd:    'connectedPeers',
                                    peers:  self._clientTopologyService.getPeers()
                                };
                                self._rtcService.send(message);
                            }
                        });
                    break;
                case 'topology':
                    this._handleTopologyMessage(message);
                    break;
                case 'getStream':
                    this._waitForFollowMeStream()
                        .then(function(stream) {
                            self._rtcPresenceClient.attachStreamToPeer(stream, message.source);
                        });
                    break;
                case 'presenter':
                    this._handlePresenterMessage(message);
                    break;
                case 'quit':
                    if (message.source.indexOf('P') != -1) {
                        this._removeOldStreamSource(message.source === this._followmeSource);
                    }
                    break;
                case 'attention':
                    this._handleAttentionMessage(message);
                    break;
                case 'resources':
                    if (message.active) {
                        this._application.classroom.activeResources = message.active;
                    }
                    if (message.focused) {
                        this._application.classroom.focusedResources = this._extractResourcesUrls(message.focused, []);
                        if (this._application.classroom.focusedResources && this._application.classroom.focusedResources.length > 0 && this._application.state != this._application.states.followMe) {
                            this._extensionService.send('focus', { cmd: 'start', resources: this._application.classroom.focusedResources });
                        } else {
                            this._extensionService.send('focus', { cmd: 'stop' });
                        }
                    }
                    break;
                case 'tab':
                    this._handleTabMessage(message);
                    break;
                case 'kick':
                    this.delete()
                        .then(function() {
                            self.exitClass();
                        });
                    break;
                case 'forwardStream':
                    this._handleForwardStreamMessage(message);
                    break;
                default:
                    console.log('Unknown message type:', message.type, message);
                    break;
            }
        }
    },

    _cpuCheck: {
        value: function () {
            var message = {cmd: 'check', type: this._type};
            return this._extensionService.send('cpuCheck', message);
        }
    },

    _handleForwardStreamMessage: {
        value: function(message) {
            var self = this;
            switch (message.cmd) {
                case 'start':
                    this._waitForFollowMeStream()
                        .then(function(stream) {
                            self._streamTarget = message.data.target;
                                self._rtcPresenceClient.attachStreamToPeer(stream, message.data.target);
                        });
                    break;
                case 'stop':
                    if (this._streamTarget) {
                        this._streamTarget = null;
                            self._rtcPresenceClient.detachStreamFromPeer(self._followMeStream, self._streamTarget);
                    }
                    break;
                default:
                    console.log('Unknown' + message.type + 'cmd:', message.cmd, message);
                    break;
            }
        }
    },

    _handleTopologyMessage: {
        value: function(message) {
            switch (message.cmd) {
                case 'nodeRemove':
                    this._clientTopologyService.removePeers(message.data.ids);
                    break;
                default:
                    console.log('Unknown topology cmd:', message.cmd, message);
                    break;
            }
        }
    },

    _handleTabMessage: {
        value: function(message) {
            var self = this;
            switch (message.cmd) {
                case 'list':
                    this._extensionService.send('tab', { cmd: 'list' })
                        .then(function(transaction) {
                            var message = {
                                type: 'tab',
                                tabs: transaction.response.data
                            };
                            self._rtcService.send(message);
                        });
                    break;
                case 'close':
                    this._extensionService.send('tab', { cmd: 'close', tabId: message.tabId });
                    break;
                default:
                    console.log('Unknown' + message.type + 'cmd:', message.cmd, message);
                    break;
            }
        }
    },

    _handleAttentionMessage: {
        value: function(message) {
            var self = this;
            switch (message.cmd) {
                case 'start':
                    location.hash = '#attention' + Date.now();
                    this._extensionService.send('follow-me', {cmd: 'start', url: location.href, lock: message.lock})
                        .then(function() {
                            self._application.state = self._application.states.attention;
                        });
                    break;
                case 'stop':
                    location.hash = '#';
                    this._extensionService.send('follow-me', {cmd: 'stop'})
                        .then(function() {
                            self._application.state = self._application.states.dashboard;
                        });
                    break;
                default:
                    console.log('Unknown' + message.type + 'cmd:', message.cmd, message);
                    break;
            }
        }
    },

    _handlePresenterMessage: {
        value: function(message) {
            switch (message.cmd) {
                case 'start':
                    this.followmeStream = this.desktopStream;
                    break;
                case 'stop':
                    this.followmeStream = null;
                    break;
                default:
                    console.log('Unknown' + message.type + 'cmd:', message.cmd, message);
                    break;
            }
        }
    },

    _handleViewScreenMessage: {
        value: function(message) {
            var self = this;
            switch (message.cmd) {
                case 'start':
                    self._rtcService.attachStream(self.desktopStream, message.source);
                    break;
                case 'pause':
                    self._rtcService.detachStream(self.desktopStream, message.source);
                    break;
                case 'stop':
                    self._rtcService.detachStream(self.desktopStream, message.source);
                    self.desktopStream.getTracks[0].stop();
                    break;
                default:
                    console.log('Unknown' + message.type + 'cmd:', message.cmd, message);
                    break;
            }
        }
    },

    _handleFollowMeMessage: {
        value: function(message) {
            var self = this;
            switch (message.cmd) {
                case 'start':
                    location.hash = '#followme' + Date.now();
                    self._extensionService.send('focus', { cmd: 'stop' })
                        .then(function() {
                            return self._extensionService.send('follow-me', {cmd: 'start', url: location.href, lock: message.lock});
                        })
                        .then(function() {
                            self._application.state = self._application.states.followMe;
                            self._inFollowMeMode = true;
                        });
                    break;
                case 'stop':
                    location.hash = '#';
                    this.followmeStream = null;
                    self._extensionService.send('follow-me', {cmd: 'stop'})
                        .then(function() {
                            self._application.state = self._application.states.dashboard;
                            self._followmeSource = null;
                            self._inFollowMeMode = false;
                        });
                    break;
                default:
                    console.log('Unknown' + message.type + 'cmd:', message.cmd, message);
                    break;
            }
        }
    },

    _signalReady: {
        value: function() {
            var message = {
                type: 'ready'
            };
            this._rtcService.send(message);
        }
    },

    _waitForFollowMeStream: {
        value: function() {
            var self = this,
                deferred = Promise.defer();
            if (this.followmeStream) {
                deferred.resolve(this.followmeStream);
            } else {
                var addStreamListener = function(event) {
                    var stream = event.stream;
                    self._rtcService.removeEventListener('addstream', addStreamListener);
                    self._rtcPresenceClient.removeEventListener('addstream', addStreamListener);
                    deferred.resolve(stream);
                };
                this._rtcService.addEventListener('addstream', addStreamListener);
                this._rtcPresenceClient.addEventListener('addstream', addStreamListener);
            }
            return deferred.promise;
        }
    },

    _askStreamToPeer: {
        value: function(peerId) {
            var message = {
                type: 'getStream'
            };
            try {
                return this._rtcPresenceClient.sendToPeer(message, peerId);
            } catch (err) {
                return false;
            }
        }
    },

    _addFollowMeStream: {
        value: function(stream, remoteId) {
            this._switchingStream = false;
            this.followmeStream = stream;
            this._followmeSource = remoteId;
        }
    },

    _connectToPeers: {
        value: function() {
            this._rtcPresenceClient.init(this._rtcService);
            var message = {
                type: 'connectPeers',
                data: {
                    id: this._rtcPresenceClient.id
                }
            };
            this._rtcService.send(message);
        }
    },

    startTracking: {
        value: function () {
            return this._extensionService.send('tracking', {cmd: 'start'});
        }
    },

    sendTrackingEvent: {
        value: function(event) {
            var message = {
                type: 'trackingEvent',
                event: event
            };
            this._rtcService.send(message);
        }
    },

    _messageHandler: {
        get: function() {
            var self = this;
            return function(message) {
                switch (message.type) {
                    case 'classroom':
                        self.save(message.classroom);
                        self._peerId = message.peerId;
                        self._application.classroom = message.classroom;
                        if (message.classroom.closeTabs) {
                            self._application.state = self._application.states.closeTabs;
                        } else {
                            self._application.state = self._application.states.dashboard;
                        }
                        break;
                    case 'connection_rejected':
                        alert('This account is already connected to the classroom.');
                        self._application.connectionRefused = true;
                        self.exitClass();
                        break;
                    case 'screen':
                        switch (message.cmd) {
                            case 'start':
                                self._rendezvousService.attachStream(self.desktopStream);
                                self._isSharingEndAuthorized = false;
                                break;
                            case 'pause':
                                self._rendezvousService.detachStream(self.desktopStream);
                                break;
                            case 'stop':
                                self._rendezvousService.detachStream(self.desktopStream);
                                self._isSharingEndAuthorized = true;
                                self.desktopStream.getTracks()[0].stop();
                                break;
                        }
                        break;
                    case 'follow-me':
                        switch (message.cmd) {
                            case 'start':
                                location.hash = '#followme' + Date.now();
                                self._extensionService.send('focus', { cmd: 'stop' })
                                    .then(function() {
                                        return self._extensionService.send('follow-me', {cmd: 'start', url: location.href, lock: message.lock});
                                    })
                                    .then(function() {
                                        self._application.state = self._application.states.followMe;
                                    });
                                break;
                            case 'stop':
                                location.hash = '#';
                                self._extensionService.send('follow-me', {cmd: 'stop'})
                                    .then(function() {
                                        self._application.state = self._application.states.dashboard;
                                    });
                                break;
                            case 'show':
                                self._application.classroom.screen = message.image;
                                break;
                        }
                        break;
                    case 'attention':
                        switch (message.cmd) {
                            case 'start':
                                location.hash = '#attention' + Date.now();
                                self._extensionService.send('follow-me', {cmd: 'start', url: location.href, lock: message.lock})
                                    .then(function() {
                                        self._application.state = self._application.states.attention;
                                    });
                                break;
                            case 'stop':
                                location.hash = '#';
                                self._extensionService.send('follow-me', {cmd: 'stop'})
                                    .then(function() {
                                        self._application.state = self._application.states.dashboard;
                                    });
                                break;
                        }
                        break;
                    case 'resources':
                        switch (message.cmd) {
                            case 'update':
                                if (message.active) {
                                    self._application.classroom.activeResources = message.active;
                                }
                                if (message.focused) {
                                    self._application.classroom.focusedResources = self._extractResourcesUrls(message.focused, []);
                                    if (self._application.classroom.focusedResources && self._application.classroom.focusedResources.length > 0 && self._application.state != self._application.states.followMe) {
                                        self._extensionService.send('focus', { cmd: 'start', resources: self._application.classroom.focusedResources });
                                    } else {
                                        self._extensionService.send('focus', { cmd: 'stop' });
                                    }
                                }
                            break;
                        }
                        break;
                    case 'tab':
                        switch (message.cmd) {
                            case 'list':
                                self._extensionService.send('tab', { cmd: 'list' })
                                    .then(function(transaction) {
                                        self._rendezvousService.sendTabs(transaction.response.data);
                                    });
                                break;
                            case 'close':
                                self._extensionService.send('tab', { cmd: 'close', tabId: message.tabId });
                                break;
                        }
                        break;
                    case 'kick':
                        self.delete()
                            .then(function() {
                                self.exitClass();
                            });
                        break;
                    case 'presenter':
                        switch (message.cmd) {
                            case 'start':
                                self._extensionService.send('notification', { cmd: 'show', params: { id: 'presenter', title: 'Presenting to the classroom.', message: self._application.classroom.teacher + " is presenting your screen to the classroom." }});
                                break;
                            case 'stop':
                                self._extensionService.send('notification', { cmd: 'hide', params: { id: 'presenter' }});
                                break;
                        }
                        break;
                }
            }
        }
    },

    _extractResourcesUrls: {
        value: function _extractResourcesUrls(resource, urls) {
            if (resource.url) {
                urls.push(resource.url);
            } else if (resource.children) {
                for (var i = 0; i < resource.children.length; i++) {
                    _extractResourcesUrls(resource.children[i], urls);
                }
            }
            return urls;
        }
    },

    _closeHandler: {
        get: function() {
            var self = this;
            return function() {
                self.exitClass();
            }
        }
    },

    _addstreamHandler: {
        get: function() {
            var self = this;
            return function(stream) {
                self.followmeStream = stream;
            };
        }
    },

    logState: {
        value: function(student) {
            var self = this;
            this._extensionService.send('information', {cmd: 'dump'})
                .then(function(transaction) {
                    var information = transaction.response.data;
                    information['student'] = student;
                    information['classroom'] = self.classroom;
                    request.json({
                        url: self._loggingEndpoint,
                        method: 'POST',
                        body: information
                    });
                    self.exitClass();
                });
        }
    }
});
