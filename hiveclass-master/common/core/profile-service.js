/**
 * @module ./profile-service
 * @requires montage/core/core
 */
var Target = require("montage/core/target").Target,
    request = require('montage/core/request'),
    Promise = require('montage/core/promise').Promise;

/**
 * @class ProfileService
 * @extends Montage
 */
exports.ProfileService = Target.specialize(/** @lends ProfileService# */ {

    _profileEndpoint:   { value: null },
    _extensionService:  { value: null },
    _profile:           { value: null },
    _secureCookies:     { value: null },
    _type:              { value: 'me' },

    constructor: {
        value: function(configuration, extensionService) {
            this._profileEndpoint = configuration.profileEndpoint;
            this._invalidateEndpoint = configuration.invalidateEndpoint;
            this._checkEndpoint = configuration.checkEndpoint;
            this._extensionService = extensionService;
            this._secureCookies = !!configuration.secureCookies ? ';secure' : '';
        }
    },

    profile: {
        get: function() {
            return this.getProfile();
        }
    },

    tokens: {
        get: function() {
            return this.getTokens();
        }
    },

    getProfile: {
        value: function() {
            var self = this;
            if (this._profile) {
                return Promise.resolve(this._profile);
            } else {
                var message = {
                        cmd: 'get',
                        type: self._type,
                        data: 'remote'
                    };
                return self._extensionService.send('storage', message)
                    .then(function(transaction) {
                        var extensionProfile = transaction.response.data;
                        var profilePromise;
                        if (extensionProfile) {
                            profilePromise = Promise.resolve({
                                profile: extensionProfile,
                                isLocal: true
                            });
                        } else {
                            profilePromise = self._getRemoteProfile();
                        }
                        return profilePromise;
                    })
                    .then(function(profileAnswer) {
                        self._profile = profileAnswer.profile;
                        return self._checkTokensCookie();
                    })
                    .then(function(isTokensCookieValid) {
                        if (isTokensCookieValid) {
                            return self._saveTokensCookie()
                                .then(function() {
                                    return true;
                                });
                        } else {
                            var message = {
                                    cmd: 'get',
                                    type: self._type,
                                    data: 'tokens'
                                };
                            return self._extensionService.send('storage', message)
                                .then(function(transaction) {
                                    var encryptedTokens = transaction.response.data;
                                    if (encryptedTokens && encryptedTokens.cookie.length > 0) {
                                        self._defineTokensCookie(encryptedTokens);
                                        return true;
                                    } else {
                                        return self._invalidateCookie()
                                            .then(function() {
                                                return false;
                                            });
                                    }
                                });
                        }
                    })
                    .then(function(isSessionValid) {
                        if (!isSessionValid) {
                            location.reload();
                        } else {
                            return self._profile;
                        }
                    });
            }
        }
    },

    _checkTokensCookie: {
        value: function() {
            return request(this._checkEndpoint)
                .then(function(response) {
                    return response.status === 204;
                });
        }
    },

    _defineTokensCookie: {
        value: function (encryptedTokens) {
            document.cookie = 'hiveschool_tokens=' + encryptedTokens.cookie + ';path=/' + this._secureCookies;
        }
    },

    _invalidateCookie: {
        value: function() {
            var self = this;
            return request(this._invalidateEndpoint)
                .then(function() {
                    var message = {
                        cmd: 'delete',
                        type: self._type,
                        data: 'tokens'
                    };
                    return self._extensionService.send('storage', message);
                });
        }
    },

    _saveTokensCookie: {
        value: function() {
            var encryptedTokens = { cookie: document.cookie.replace(/(?:(?:^|.*;\s*)hiveschool_tokens\s*\=\s*([^;]*).*$)|^.*$/, "$1") };
            return this.save('tokens', encryptedTokens);
        }
    },

    save: {
        value: function(id, profile) {
            return this._sendPersistCommand('save', id, profile);
        }
    },

    update: {
        value: function(id, profile) {
            return this._sendPersistCommand('update', id, profile);
        }
    },

    _getRemoteProfile: {
        value: function() {
            var self = this;
            return request(this._profileEndpoint)
                .then(function(response) {
                    var profile = JSON.parse(response.body);
                    self.save('remote', profile);
                    return {
                        profile: profile,
                        isLocal: false
                    };
                });
        }
    },

    _sendPersistCommand: {
        value: function (cmd, id, profile) {
            profile.id = id;
            var message = {cmd: cmd, type: this._type, data: profile};
            return this._extensionService.send('storage', message);
        }
    }
});
