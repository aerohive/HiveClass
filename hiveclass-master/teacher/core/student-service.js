/**
 * @module core/student-service
 */
var Target = require("montage/core/target").Target,
    Promise = require('montage/core/promise').Promise;
/**
 * @class StudentService
 * @extends Target
 */
exports.StudentService = Target.specialize(/** @lends StudentService# */ {
    _extensionService: {
        value: null
    },

    _rendezvousService: {
        value: null
    },

    _studentUrl: {
        value: null
    },

    _type: {
        value: 'student'
    },

    constructor: {
        value: function StudentService(extensionService, wsPresenceClient, configuration) {
            this._extensionService = extensionService;
            this._studentUrl = configuration.studentUrl;
            this._wsPresenceClient = wsPresenceClient;
        }
    },

    get: {
        value: function(email) {
            var message = {cmd: 'get', type: this._type, data: email};
            return this._extensionService.send('storage', message);
        }
    },

    save: {
        value: function(profile) {
            if (profile.email) {
                var self = this;
                return this.get(profile.email)
                    .then(function(transaction) {
                        var student;
                        if (transaction.response.data) {
                            student = transaction.response.data;
                        } else {
                            student = profile;
                            student.timestamps = [];
                        }
                        student.timestamps.push(Date.now());
                        var message = {cmd: 'save', type: self._type, data: student};
                        return self._extensionService.send('storage', message);
                    })
            }
        }
    },

    lock: {
        value: function(student) {
            var message = {
                type: 'attention',
                cmd: 'start',
                url: this._studentUrl,
                lock: true
            };
            this._wsPresenceClient.sendToClient(message, student.peerId);
            student.attentionOn = true;
        }
    },

    unlock: {
        value: function(student) {
            student.attentionOn = false;
            var message = {
                type: 'attention',
                cmd: 'stop'
            };
            this._wsPresenceClient.sendToClient(message, student.peerId);
        }
    }
});
