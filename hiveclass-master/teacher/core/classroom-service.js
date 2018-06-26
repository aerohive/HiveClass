/**
 * @module ./classroom-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target,
    Promise = require('montage/core/promise').Promise,
    Application = require("montage/core/application").application,
    request = require('montage/core/request'),
    Bindings = require("montage/core/core").Bindings;

/**
 * @class ClassroomService
 * @extends Target
 */
exports.ClassroomService = Target.specialize(/** @lends ClassroomService# */ {
    _extensionService: { value: null },
    _rendezvousService: { value: null },
    _studentService: { value: null },
    _studentUrl: { value: null },
    _storageUrl: { value: null },
    _type: { value: 'classroom' },
    _sendScreenInterval: { value: null },
    followedStudent: { value: null },
    classroom: { value: null },
    viewedStudent: { value: null },
    isStudentsListSorted: { value: false },
    _currentMode: { value: null },
    _focusMode: { value: null },
    _followmeMode: { value: null },
    _lockMode: { value: null },
    _presenterMode: { value: null },
    studentsStreams: { value: {} },
    desktopStream: { value: null },
    _closing: { value: false },
    isSharingEnabled: { value: true},

    constructor: {
        value: function(extensionService, rendezvousService, studentService, teacherService, focusMode, followmeMode, lockMode, presenterMode, wsPresenceClient, topologyService, configuration) {
            this._extensionService = extensionService;
            this._rendezvousService = rendezvousService;
            this._studentService = studentService;
            this._teacherService = teacherService;
            this._focusMode = focusMode;
            this._followmeMode = followmeMode;
            this._lockMode = lockMode;
            this._presenterMode = presenterMode;
            this._studentUrl = configuration.studentUrl;
            this._storageUrl = configuration.storageEndpoint;
            this._wsPresenceClient = wsPresenceClient;
            this._topologyService = topologyService;
            this._loggingUrl = configuration.loggingEndpoint;
            this.addEventListener('studentsChange', this);

            var self = this;
            this._wsPresenceClient.addEventListener('message', function(event) {
                self._handleMessage(JSON.parse(event.data));
            });
            this._wsPresenceClient.addEventListener('addstream', function(event) {
                self._addStreamToStudent(event.stream, event.remoteId);
            });
            this._wsPresenceClient.addEventListener('close', function() {
                self.close();
            });
            this._wsPresenceClient.addEventListener('connectionClose', function(event) {
                self._exitStudentFromClassroom(event.detail);
            });
            this._wsPresenceClient.addEventListener('pongTimeout', function(event) {
                self._logPongTimeout(event.detail);
            });

            this._focusMode.onstop = function() {
                if (self._currentMode && self._currentMode.name === this.name ) {
                    self._currentMode = null;
                }
                if (self.classroom && self.classroom.focusedResources && self.classroom.focusedResources.children.length > 0) {
                    self.setFocusedResourcesInClassroom(null, self.classroom);
                }
            };

            this._presenterMode.onstop = function() {
                if (self._currentMode && self._currentMode.name === this.name ) {
                    self._currentMode = null;
                }
                self.followedStudent = null;
            };

            this._followmeMode.onstart = function(stream) {
                if (stream) {
                    self.desktopStream = stream;
                } else {
                    self._currentMode = null;
                    self.classroom.following = null;
                }
            };
            this._followmeMode.onstop = function() {
                if (self._currentMode && self._currentMode.name === this.name ) {
                    self._currentMode = null;
                }
                self.desktopStream.getVideoTracks()[0].stop();
                self.desktopStream = null;
                self.classroom.following = false;
            };

            Bindings.defineBinding(this, "canPresentStudent", {"<-": "this.classroom.students.length > 0 && this.classroom.students.length <= 8"});

            this._loggedStudentDisconnections = [];
        }
    },

    registerListener: {
        value: function(eventName, listener) {
            this.addEventListener(eventName, listener);
        }
    },

    _checkMeshStrength: {
        value: function () {
            var message = {cmd: 'check', type: this._type};
            return this._extensionService.send('mesh', message);
        }
    },

    enter: {
        value: function(teacherEmail, classroomName, classroomId) {
            var self = this,
                presenceClassroom;
            Application.analyticsService.set('dimension3', classroomId);
            
            self._checkMeshStrength()
                .then(function(info) {
                    if(info.response.data.numOfProcessors >= 8) {
                        self._topologyService._strongMesh = true;
                    }
                });
                
            
            return this._wsPresenceClient.createRoom(classroomName, classroomId)
                .then(function(classroom) {
                    presenceClassroom = classroom;
                    return self.get(classroom.id);
                })
                .then(function(classroom) {
                    classroom = classroom || presenceClassroom;
                    if (classroom.lock) {
                        self.lock(classroom);
                    } else {
                        classroom.code = presenceClassroom.code;
                    }
                    self.classroom = classroom;
                    self.classroom.students = [];
                    self.classroom.currentActivity = [];
                    self.classroom.registeredStudents = self.classroom.registeredStudents || [];
                    self.classroom.previousActivity = null;

                    var now = new Date();
                    var monthInt    = now.getMonth() + 1,
                        dayInt      = now.getDate(),
                        month       = (monthInt < 10 ? '0' : '') + monthInt,
                        day         = (dayInt < 10 ? '0' : '') + dayInt;
                    self.classroom.session = [now.getFullYear(), month, day].join('-') + '_' + [now.getHours(), now.getMinutes()].join(':');
                    self.classroom.timestamps = {
                        start: self._getEpoch(now)
                    };
                    self.getPreviousTrackingData()
                        .then(function(transaction) {
                            self.classroom.previousActivity = transaction.response.data;
                        });
                    return classroom;
                });
        }
    },

    close: {
        value: function() {
            var self = this;
            if (!this._closing) {
                this._closing = true;
                var closeTimeout = setTimeout(function() {
                    self._closing = false;
                }, 10000);
                self.stopFollowMe();
                if (self.classroom) {
                    self.classroom.timestamps.end = self._getEpoch();
                    for (var i = 0, activitiesCount = self.classroom.currentActivity.length; i < activitiesCount; i++) {
                        self.classroom.currentActivity[i].activity.push(
                            {
                                timestamp: this.classroom.timestamps.end,
                                url: 'CLASSROOM_END'
                            }
                        );
                    }
                    var classroomId = self.classroom.id;
                    return Promise.all([this.update(), self._wsPresenceClient.closeRoom(classroomId)])
                        .then(function () {
                            return self._saveTrackingData(self.classroom);
                        })
                        .then(function() {
                            self._extensionService.send('notification', { cmd: 'clear' });
                            Application.state = Application.states.init;
                            self.classroom = null;
                            self._closing = false;
                            self.mustReload = true;
                            clearTimeout(closeTimeout);
                        });
                } else {
                    self._extensionService.send('notification', { cmd: 'clear' });
                    self._closing = false;
                    self.mustReload = true;
                    clearTimeout(closeTimeout);
                    return Promise.resolve();
                }
            }
        }
    },

    _backupData: {
        value: function () {
            var message = { cmd: 'backup', type: this._type, url: this._storageUrl + this._type + '.json' };
            return this._extensionService.send('storage', message);
        }
    },

    _restoreData: {
        value: function () {
            var message = { cmd: 'restore', type: this._type, url: this._storageUrl + this._type + '.json' };
            return this._extensionService.send('storage', message);
        }
    },

    sync: {
        value: function() {
            var self = this;
            return this.list()
                .then(function(classrooms) {
                    if (!classrooms || classrooms.length == 0) {
                        return self._restoreData();
                    }
                });
        }
    },

    _cleanClassroom: {
        value: function(classroom) {
            return JSON.parse(JSON.stringify(classroom));
        }
    },

    save: {
        value: function(classroom) {
            var self = this;
            classroom = classroom || this.classroom;
            var message = { cmd: 'save', type: this._type, data: this._cleanClassroom(classroom) };
            return this._extensionService.send('storage', message)
                .then(function() {
                    self._backupData();
                    return true;
                });
        }
    },

    update: {
        value: function(classroom) {
            var self = this;
            classroom = classroom || this.classroom;
            var message = {cmd: 'update', type: this._type, data: this._cleanClassroom(classroom)};
            return this._extensionService.send('storage', message)
                .then(function() {
                    self._backupData();
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
        value: function(classroomId) {
            var message = {cmd: 'get', type: this._type, data: classroomId};
            return this._extensionService.send('storage', message)
                .then(function(transaction) {
                    return transaction.response.data;
                });
        }
    },

    delete: {
        value: function(classroomId) {
            var closePromise,
                self = this;
            var isClosingCurrentClassroom = !classroomId || (this.classroom && this.classroom.id === classroomId);
            classroomId = classroomId || self.classroom.id;
            if (isClosingCurrentClassroom) {
                closePromise = this.close();
            } else {
                closePromise = Promise.resolve();
            }
            return closePromise
                .then(function() {
                    var message = {cmd: 'delete', type: self._type, data: classroomId};
                    return self._extensionService.send('storage', message);
                });
        }
    },

    lock: {
        value: function(classroom) {
            classroom = classroom || this.classroom;
            var self = this;
            return this._wsPresenceClient.lock(classroom)
                .then(function(data) {
                    classroom.code = null;
                    classroom.lock = true;
                    self.update(classroom);
                    return data;
                });
        }
    },

    unlock: {
        value: function(classroom) {
            classroom = classroom || this.classroom;
            var self = this;
            return this._wsPresenceClient.unlock(classroom)
                .then(function(data) {
                    classroom.code = data.code;
                    classroom.lock = false;
                    self.update(classroom);
                    return data;
                });
        }
    },

    _saveTrackingData: {
        value: function(classroom) {
            classroom = classroom || this.classroom;
            var message = { cmd: 'save', classroomId: classroom.id, session: classroom.session, url: this._storageUrl + 'tracking_' +  classroom.id + '.json', activities: classroom.currentActivity };
            return this._extensionService.send('tracking', message);
        }
    },

    getPreviousTrackingData: {
        value: function(classroom) {
            classroom = classroom || this.classroom;
            var message = { cmd: 'getPrevious', classroomId: classroom.id, url: this._storageUrl + 'tracking_' +  this.classroom.id + '.json' };
            return this._extensionService.send('tracking', message);
        }
    },

    _startTrackingStudentActivity: {
        value: function (profile) {
            var existingStudentActivity = this.classroom.currentActivity.filter(function(x) { return x.email == profile.email })[0];
            if (existingStudentActivity) {
                existingStudentActivity.peerId = profile.peerId
            } else {
                this.classroom.currentActivity.push({
                    email: profile.email,
                    firstname: profile.firstname,
                    lastname: profile.lastname,
                    peerId: profile.peerId,
                    activity: [{
                        timestamp: this.classroom.timestamps.start,
                        url: 'CLASSROOM_START'
                    }]
                });
            }
        }
    },

    addStudentToClassroom: {
        value: function (profile, peerId) {
            var registeredStudentIndex = this._getRegisteredStudentIndex(profile.email);
            if (registeredStudentIndex != -1) {
                this.classroom.registeredStudents.splice(registeredStudentIndex, 1, profile);
            } else {
                this.classroom.registeredStudents.push(profile);
            }
            profile.peerId = peerId;
            this._startTrackingStudentActivity(profile);
            this.classroom.students.push(profile);
            this._trackStudentActivity({
                source: profile.peerId,
                event: {
                    timestamp: this._getEpoch(),
                    url: 'ENTER'
                }
            });
            this.update();
            this._studentService.save(profile);
            this.dispatchEventNamed('studentsChange', true, false, this.classroom.students);
        }
    },

    _exitStudentFromClassroom: {
        value: function (studentId, isExpected) {
            var self = this,
                information = {},
                studentIndex = this._getStudentIndexByPeerId(studentId);

            if (!isExpected) {
                information.studentId = studentId;
                information.classroom = this.classroom;
                information.topology = this._topologyService.getTopology();
                information.mode = this._currentMode
            }

            if (studentIndex != -1) {
                var student = this.classroom.students[studentIndex];
                this.classroom.students.splice(studentIndex, 1);
                this.dispatchEventNamed('studentsChange', true, false, this.classroom.students);
                this._notifyStudentExit(student);
                this._trackStudentActivity({
                    source: student.peerId,
                    event: {
                        timestamp: this._getEpoch(),
                        url: 'EXIT'
                    }
                });
                information.student = student
            }
            this._wsPresenceClient.removeClient(studentId);
            var removedNodes = this._topologyService.removeNode(studentId);
            this._wsPresenceClient.sendToClients({
                type:   'topology',
                cmd:    'nodeRemove',
                data:   {
                    ids: removedNodes
                }
            });
            this._topologyService.removeNode(studentId);
            if (this.desktopStream) {
                this._followmeMode.distributeStream();
            } else if (this.followedStudent) {
                this._followmeMode.distributeStream();
            }
            if (this.classroom.students.length == 0) {
                this.stopFollowMe();
            }
            if (!isExpected && this._loggedStudentDisconnections.indexOf(studentId) == -1) {
/*
    FIXME: As soon as new extension is deployed, activate system information collecting
                this._extensionService.send('information', {cmd: 'dump'})
                    .then(function(transaction) {
                        information.system = transaction.response.data;
                        request.json({
                            url: self._loggingUrl,
                            method: 'POST',
                            body: information
                        });
                    });
*/
                request.json({
                    url: this._loggingUrl,
                    method: 'POST',
                    body: information
                });

            }
            this._loggedStudentDisconnections.push(studentId);
        }
    },

    _logPongTimeout: {
        value: function(details) {
            var studentIndex = this._getStudentIndexByPeerId(details.client);
            if (studentIndex != -1) {
                var student = this.classroom.students[studentIndex];
                student._pongTimeout = true;
            }
        }
    },

    _handleMessage: {
        value: function(message) {
            var self = this;
            var studentId = message.source;
            switch (message.type) {
                case 'intro':
                    var profile = message.profile;
                    if (this.classroom.students.map(function(x) { return x.email; }).indexOf(profile.email) == -1) {
                        this.addStudentToClassroom(profile, studentId);
                        this._teacherService.getProfile()
                            .then(function(profile) {
                                var classroom = {
                                    id: self.classroom.id,
                                    name: self.classroom.name,
                                    teacher: profile.usageName,
                                    lock: self.classroom.lock,
                                    closeTabs: self.classroom.closeTabs,
                                    activeResources: self.classroom.activeResources,
                                    focusedResources: self.classroom.focusedResources
                                };
                                self._wsPresenceClient.sendToClient({ type: 'classroom', classroom: classroom, peerId: message.source }, message.source);
                            });
                    } else {
                        this._wsPresenceClient.sendToClient({ type: 'connection_rejected' }, studentId);
                        this._wsPresenceClient.removeClient(studentId);
                    }
                    break;
                case 'quit':
                    if (!self._closing && self.classroom && self.classroom.students) {
console.log('STUDENT EXIT');
                        this._exitStudentFromClassroom(studentId, true);
                    }
                    break;
                case 'connectPeers':
                    var message = {
                        type: 'addPeer',
                        data: {
                            id: message.data.id
                        }
                    };
                    self._wsPresenceClient.sendToClients(message);
                    break;
                case 'topology':
                    self._handleTopologyMessage(message);
                    break;
                case 'ready':
                    self._joinCurrentMode(studentId);
                    break;
                case 'tab':
                    var student = this.classroom.students.filter(function(x) { return x.peerId == message.source; })[0];
                    if (student) {
                        student.tabs = message.tabs;
                    }
                    break;
                case 'trackingEvent':
                    this._trackStudentActivity(message);
                    break;
                case 'webrtc':
                    this._wsPresenceClient.sendToClient(message, message.data.targetClient);
                    break;
                default:
                    console.log('Unknown message type:', message.type, message);
                    break;
            }
        }
    },

    _trackStudentActivity: {
        value: function(message) {
            var student = this.classroom.currentActivity.filter(function(x) { return x.peerId == message.source; })[0];
            var event = message.event;
            event.timestamp = this._getEpoch();
            student.activity.push(event);
        }
    },

    _getEpoch: {
        value: function(date) {
            var timestamp = date ? date.getTime() : Date.now();
            return Math.round(timestamp / 1000);
        }
    },

    _handleTopologyMessage: {
        value: function(message) {
            switch (message.cmd) {
                case 'getTopology':
                    var answer = {
                        type: 'topology',
                        cmd: 'topology',
                        target: message.source,
                        data: {
                            id: this._topologyService.getTopology()
                        }
                    };
                    this._wsPresenceClient.sendToClient(answer, answer.source);
                    break;
                case 'connectedPeers':
                    this._topologyService.updateNodeConnections(message.source, message.peers);
                    break;
                default:
                    console.log('Unknown topology cmd:', message.cmd, message);
                    break;
            }
        }
    },

    _addStreamToStudent: {
        value: function(stream, peerId) {
            this._getStudentByPeerId(peerId).desktopStream = stream;
        }
    },

    _notifyStudentExit: {
        value: function(student) {
            this._extensionService.send('notification', { cmd: 'show', params: {
                id: student.email,
                title: 'Student exit.',
                message: student.firstname + " " + student.lastname + " has exited the classroom." }});
        }
    },

    _studentDisconnectionHandler: {
        get: function() {
            var self = this;
            return function(peerId) {
                if (self.classroom && self.classroom.students) {
                    var studentIndex = self._getStudentIndexByPeerId(peerId);
                    if (studentIndex != -1) {
                        self.classroom.students.splice(studentIndex, 1);
                        self.dispatchEventNamed('studentsChange', true, false, self.classroom.students);
                    }
                }
            };
        }
    },

    _joinCurrentMode: {
        value: function(peerId) {
            if (this._currentMode) {
                this._currentMode.join(peerId);
            }
        }
    },

    _addStreamHandler: {
        get: function() {
            var self = this;
            return function(stream, peerId) {
                self.studentsStreams[peerId] = stream;
            };
        }
    },

    startViewingScreen: {
        value: function(student) {
            var message = {
                type: 'viewScreen',
                cmd: 'start'
            };
            this._wsPresenceClient.sendToClient(message, student.peerId);
        }
    },

    pauseViewingScreen: {
        value: function(student) {
            var message = {
                type: 'viewScreen',
                cmd: 'pause'
            };
            this._wsPresenceClient.sendToClient(message, student.peerId);
            student.desktopStream = null;
        }
    },

    stopViewingScreen: {
        value: function(student) {
            var message = {
                type: 'viewScreen',
                cmd: 'stop'
            };
            this._wsPresenceClient.sendToClient(message, student.peerId);
            student.desktopStream = null;
        }
    },

    _startPresentingStudentScreen: {
        value: function (student) {
            var modeStatus = this._presenterMode.startFromMode(this._currentMode, [student.desktopStream, student, this.classroom.students, this._studentUrl]);
            if (modeStatus.success) {
                this._currentMode = modeStatus.mode;
                this.followedStudent = student;
            } else {
                alert(modeStatus.message);
            }
            return modeStatus.success;
        }
    },

    _stopPresentingStudentScreen: {
        value: function () {
            if (this._currentMode && this._currentMode.name === this._presenterMode.name) {
                this._presenterMode.stop(this.followedStudent);
                this.followedStudent = null;
                this._currentMode = null;
            }
            return false;
        }
    },

    _startPresentingTeacherScreen: {
        value: function () {
            var modeStatus = this._followmeMode.startFromMode(this._currentMode, [this._studentUrl]);
            if (modeStatus.success) {
                this._currentMode = modeStatus.mode;
            } else {
                alert(modeStatus.message);
                this.classroom.following = null;
            }
            return modeStatus.success;
        }
    },

    _stopPresentingTeacherScreen: {
        value: function () {
            if (this._currentMode && this._currentMode.name === this._followmeMode.name) {
                this._followmeMode.stop();
                this._currentMode = null;
            }
            return false;
        }
    },

    startFollowMe: {
        value: function(student) {
            Application.analyticsService.trackEvent({
                'eventCategory': 'button',
                'eventAction': 'click',
                'eventLabel': 'Started Follow Me',
                'screenName': 'Dashboard'
            });

            if (student) {
                this.classroom.following = 'student';
                return this._startPresentingStudentScreen(student);
            } else {
                this.classroom.following = 'teacher';
                return this._startPresentingTeacherScreen();
            }
        }
    },

    stopFollowMe: {
        value: function() {
            if (this.followedStudent) {
                this._stopPresentingStudentScreen();
            } else {
                this._stopPresentingTeacherScreen();
            }
            this.classroom.following = false;
        }
    },

    _lockStudentToUrl: {
        value: function (student, studentUrl) {
            var modeStatus = this._lockMode.startFromMode(this._currentMode, [student, studentUrl]);
            if (modeStatus.success) {
                student.attentionOn = true;
                this._currentMode = modeStatus.mode;
            } else {
                alert(modeStatus.message);
            }
            return modeStatus.success;        }
    },

    _unlockStudent: {
        value: function(student) {
            this._lockMode.stop([student]);
            student.attentionOn = false;
            this._currentMode = null;
            return false;
        }
    },

    getAttention: {
        value: function(student) {
            var studentUrl = this._studentUrl;
            if (student && student.peerId) {
                this._lockStudentToUrl(student, studentUrl);
            } else {
                this.classroom.attentionOn = true;
                for (var i = 0, studentsLength = this.classroom.students.length; i < studentsLength; i++) {
                    this._lockStudentToUrl(this.classroom.students[i], studentUrl);
                }
            }
        }
    },

    releaseAttention: {
        value: function(student) {
            if (student && student.peerId) {
                this._unlockStudent(student)
            } else {
                this.classroom.attentionOn = false;
                for (var i = 0, studentsLength = this.classroom.students.length; i < studentsLength; i++) {
                    this._unlockStudent(this.classroom.students[i]);
                }
            }
        }
    },

    _getRegisteredStudentIndex: {
        value: function (email) {
            return this.classroom.registeredStudents.map(function (x) { return x.email.toLowerCase(); }).indexOf(email.toLowerCase());
        }
    },

    _isStudentRegistered: {
        value: function (email) {
            return this._getRegisteredStudentIndex(email) != -1;
        }
    },

    registerStudent: {
        value: function (firstname, lastname, email) {
            if (!this._isStudentRegistered(email)) {
                this.classroom.registeredStudents.push({
                    firstname: firstname,
                    lastname: lastname,
                    email: email
                });
                this.update(this.classroom);
                return true;
            }
            return false;
        }
    },

    unRegisterStudent: {
        value: function (email, isConnected) {
            email = email.toLowerCase();
            if (this._isStudentRegistered(email)) {
                this.classroom.registeredStudents.splice(this._getRegisteredStudentIndex(email), 1);
                this.update(this.classroom);
            }
            if (isConnected) {
                var studentsEmails = this.classroom.students.map(function(x) { return x.email.toLowerCase(); });
                var studentIndex = studentsEmails.indexOf(email);
                var student = this.classroom.students[studentIndex];
                this.classroom.students.splice(studentIndex, 1);
                var message = {
                    type: 'kick'
                };
                this._wsPresenceClient.sendToClient(message, student.peerId);
            }
        }
    },

    moveStudent: {
        value: function(studentEmail, position) {
            this.isStudentsListSorted = false;
            var index = this.classroom.registeredStudents.map(function (x) { return x.email.toLowerCase(); }).indexOf(studentEmail.toLowerCase());

            if (index != position && position != index + 1) {
                var student = this.classroom.registeredStudents[index];
                this.classroom.registeredStudents.splice(index, 1);
                this.classroom.registeredStudents.splice(position, 0, student);
            }

        }
    },

    setActiveResourcesInClassroom: {
        value: function(resources, classroom) {
            var self = this;
            classroom = classroom || this.classroom;
            classroom.activeResources = resources;
            return this.update(classroom)
                .then(function() {
                    if (classroom.id == self.classroom.id) {
                        self.classroom.activeResources = classroom.activeResources;
                        var message = {
                            type: 'resources',
                            cmd: 'update',
                            active: classroom.activeResources
                        };
                        self._wsPresenceClient.sendToClients(message);
                    }
                });
        }
    },

    setFocusedResourcesInClassroom: {
        value: function(resources, classroom) {
            var self = this;
            classroom = !!classroom && classroom.id != this.classroom.id ? classroom : this.classroom;
            classroom.focusedResources = resources;
            if (classroom.id == self.classroom.id) {
                return self._focusMode.startFromMode(self._currentMode, [resources])
                    .then(function(modeStatus) {
                        if (modeStatus.success) {
                            self._currentMode = modeStatus.mode;
                        } else {
                            alert(modeStatus.message);
                        }
                        return modeStatus.success;
                    });
            } else {
                return Promise.resolve(true);
            }
        }
    },

    listTabsFromStudent: {
        value: function(student) {
            var message = {
                type: 'tab',
                cmd: 'list'
            };
            this._wsPresenceClient.sendToClient(message, student.peerId);
        }
    },

    closeStudentTab: {
        value: function(student, tab) {
            var message = {
                type: 'tab',
                cmd: 'close',
                tabId: tab.id
            };
            this._wsPresenceClient.sendToClient(message, student.peerId);
        }
    },

    isStudentConnected: {
        value: function(student) {
            if (student && student.email && this.classroom && this.classroom.students) {
                return this.classroom.students.map(function(x) { return x.email.toLowerCase(); }).indexOf(student.email.toLowerCase()) != -1;
            }
            return false;
        }
    },

    _getStudentIndexByPeerId: {
        value: function (peerId) {
            var peerIds = this.classroom.students.map(function (x) {
                return x.peerId;
            });
            return peerIds.indexOf(peerId);
        }
    },

    _getStudentByPeerId: {
        value: function(peerId) {
            var studentIndex = this._getStudentIndexByPeerId(peerId);
            if (studentIndex != -1) {
                return this.classroom.students[studentIndex];
            }
            return null;
        }
    }
});
