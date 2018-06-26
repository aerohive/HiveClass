var Promise = require('bluebird'),
    HttpClient = require('./httpClient').HttpClient,
    google = require('googleapis'),
    OAuth2 = google.auth.OAuth2;

exports.GoogleDriveService = function(authenticationConfig, drive, oauth2Client, httpClient) {
    if (typeof drive === 'undefined') {
        this._oauth2Client = new OAuth2(authenticationConfig.clientId, authenticationConfig.clientSecret);
        this._oauth2Client.setCredentials({
            access_token:   authenticationConfig.accessToken,
            refresh_token:  authenticationConfig.refreshToken,
            expiry_date:    authenticationConfig.expiryDate
        });

        this._drive = google.drive({ version: 'v2', auth: this._oauth2Client });
        this._httpClient = new HttpClient();
    } else {
        this._drive = drive;
        this._oauth2Client = oauth2Client;
        this._httpClient = httpClient;
    }

    this.getFile = function(name) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self._drive.files.list({q: "'appfolder' in parents and title = '" + name + "'"},
            function(err, response) {
                if (err) return reject(err);
                resolve(response.items[0]);
            });
        });
    };

    this.uploadFile = function(name, type, content) {
        var self = this;
        return self.getFile(name)
            .then(function(file) {
                return new Promise(function(resolve, reject) {
                    if (!file) {
                        self._drive.files.insert({
                            resource: {
                                title: name,
                                mimeType: type,
                                parents: [{id: 'appfolder'}]
                            },
                            media: {
                                mimeType: type,
                                body: content
                            }
                        }, function(err, response) {
                            if (err) return reject(err);
                            resolve(response.selfLink);
                        });
                    } else {
                        self._drive.files.update({
                            fileId: file.id,
                            newRevision: true,
                            media: {
                                mimeType: type,
                                body: content
                            }
                        }, function(err, response) {
                            if (err) return reject(err);
                            resolve(response.selfLink);
                        });
                    }
                });
            });
    };

    this.downloadFile = function(name) {
        var self = this;
        return self.getFile(name)
            .then(function(file) {
                if (file) {
                    return self._httpClient.get(file.downloadUrl, { accessToken: self._oauth2Client.credentials.access_token })
                        .then(function(response) {
                            return {
                                type: response.headers['content-type'],
                                content: response.body
                            };
                        });
                } else {
                    return Promise.resolve();
                }
            });
    };

    this.getNewAuthTokens = function() {
        var credentials = this._oauth2Client.credentials;
        return {
            access: credentials.access_token,
            refresh: credentials.refresh_token,
            expires: credentials.expiry_date
        }
    }
};