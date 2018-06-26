var expect = require('chai').expect;
var Promise = require('bluebird'),
    GoogleDriveService = require('../../lib/googleDriveService').GoogleDriveService;

describe('GoogleDriveService', function() {
    describe('getFile', function() {
        describe('when file does exist', function() {
            it('should return file object', function(done) {
                var driveMock = {
                    files: {
                        list: function(params, callback) {
                            callback(null, {items: [{id: '42', title: 'foo'}]});
                        }
                    }
                };
                var service = new GoogleDriveService(null, driveMock);

                service.getFile('foo')
                    .then(function(file) {
                        expect(file).to.not.be.undefined;
                        expect(file).to.contain.all.keys('id', 'title');
                        expect(file.id).to.equal('42');
                        expect(file.title).to.equal('foo');
                        done();
                    });
            });
        });

        describe('when file does not exist', function() {
            it('should return undefined', function(done) {
                var driveMock = {
                    files: {
                        list: function(params, callback) {
                            callback(null, {items: []});
                        }
                    }
                };
                var service = new GoogleDriveService(null, driveMock);

                service.getFile('foo')
                    .then(function(file) {
                        expect(file).to.be.undefined;
                        done();
                    });
            });
        });
    });

    describe('uploadFile', function() {
        describe('when target does not exists', function() {
            it('should create a new file', function(done) {
                var hasInsertedFile = false,
                    givenParams,
                    driveMock = {
                    files: {
                        list: function(params, callback) {
                            callback(null, { items: [] });
                        },
                        insert: function(params, callback) {
                            hasInsertedFile = true;
                            givenParams = params;
                            callback(null, {});
                        }
                    }
                };
                var service = new GoogleDriveService(null, driveMock);

                service.uploadFile('foo', 'text/plain', 'Dummy data')
                    .then(function() {
                        expect(hasInsertedFile).to.be.true;
                        expect(givenParams).to.not.be.undefined;
                        expect(givenParams).to.be.an('object');
                        expect(givenParams).to.have.all.keys('resource', 'media');
                        expect(givenParams.resource).to.deep.equal({
                            title: 'foo',
                            mimeType: 'text/plain',
                            parents: [{ id: 'appfolder' }]
                        });
                        expect(givenParams.media).to.deep.equal({
                            mimeType: 'text/plain',
                            body: 'Dummy data'
                        });
                        done();
                    });
            });
            it('should return the created file url', function(done) {
                var driveMock = {
                    files: {
                        list: function(params, callback) {
                            callback(null, { items: [] });
                        },
                        insert: function(params, callback) {
                            callback(null, { selfLink: 'http://bar/baz'});
                        }
                    }
                };
                var service = new GoogleDriveService(null, driveMock);

                service.uploadFile('foo', 'text/plain', 'Dummy data')
                    .then(function(file) {
                        expect(file).to.not.be.undefined;
                        expect(file).to.be.a('string');
                        done();
                    });
            });

        });

        describe('when target does exists', function() {
            it('should update the existing file', function(done) {
                var hasUpdatedFile = false,
                    givenParams,
                    driveMock = {
                    files: {
                        list: function(params, callback) {
                            callback(null, {
                                items: [{
                                    title: 'foo',
                                    id: '42',
                                    mimeType: 'text/plain',
                                    parents: [{ id: 'appfolder' }]
                                }]
                            });
                        },
                        update: function(params, callback) {
                            hasUpdatedFile = true;
                            givenParams = params;
                            callback(null, {});
                        }
                    }
                };
                var service = new GoogleDriveService(null, driveMock);

                service.uploadFile('foo', 'text/plain', 'Dummy data')
                    .then(function() {
                        expect(hasUpdatedFile).to.be.true;
                        expect(givenParams).to.not.be.undefined;
                        expect(givenParams).to.be.an('object');
                        expect(givenParams).to.deep.equal({
                            fileId: '42',
                            newRevision: true,
                            pinned: true,
                            media: {
                                mimeType: 'text/plain',
                                body: 'Dummy data'
                            }
                        });
                        done();
                    });
            });
            it('should return the updated file url', function(done) {
                var driveMock = {
                        files: {
                            list: function(params, callback) {
                                callback(null, {
                                    items: [{
                                        title: 'foo',
                                        id: '42',
                                        mimeType: 'text/plain',
                                        parents: [{ id: 'appfolder' }]
                                    }]
                                });
                            },
                            update: function(params, callback) {
                                callback(null, { selfLink: 'http://bar/baz'});
                            }
                        }
                    };
                var service = new GoogleDriveService(null, driveMock);

                service.uploadFile('foo', 'text/plain', 'Dummy data')
                    .then(function(file) {
                        expect(file).to.not.be.undefined;
                        expect(file).to.be.a('string');
                        done();
                    });
            });
        });
    });

    describe('download file', function() {
        describe('when file does exists', function() {
            it('should return the file content', function(done) {
                var driveMock = {
                    files: {
                        list: function(params, callback) {
                            callback(null, {items: [{id: '42', title: 'foo', downloadUrl: 'http://bar/foo'}]});
                        }
                    }
                },
                oauth2ClientMock = {
                    credentials: {
                        access_token: 'baz42'
                    }
                },
                httpClientMock = {
                    get: function(url, options) {
                        return Promise.resolve({
                            headers: { 'content-type': 'foo/type' },
                            body: 'blah blah blah'
                        });
                    }
                };
                var service = new GoogleDriveService(null, driveMock, oauth2ClientMock, httpClientMock);

                service.downloadFile('foo')
                    .then(function(file) {
                        expect(file).to.not.be.undefined;
                        expect(file).to.contain.all.keys('type', 'content');
                        expect(file.type).to.equal('foo/type');
                        expect(file.content).to.equal('blah blah blah');
                        done();
                    });
            })
        });
    });
});
