requirejs.config({
    baseUrl: 'js',
    paths: {
        indexedDB: '../common/js/services/indexedDB',
        screen: '../common/js/services/screen',
        bookmark: '../common/js/services/bookmark',
        backup: '../common/js/services/backup',
        notification: '../common/js/services/notification',
        tracking: '../common/js/services/tracking',
        bluebird: './vendor/bluebird'
    }
});

requirejs(['indexedDB', 'screen', 'bookmark', 'backup', 'notification', 'tracking', 'configuration'], function(IndexedDBService, ScreenService, BookmarkService, BackupService, NotificationService, TrackingService, configuration) {
    chrome.browserAction.onClicked.addListener(function() {
        chrome.tabs.create({
            url: configuration.application.url
        });
    });

    function makeDataResponse(id, data) {
        return {id: id, success: true, data: data};
    }

    function makeErrorResponse(id, err) {
        return {id: id, success: false, cause: err};
    }

    function makeEmptyResponse(id) {
        return {id: id, success: true};
    }

    var screenService = new ScreenService({
        compressionLevel: 0.5,
        captureWidth: 1920,
        desktopMedia: ["window", "screen"],
        role: ScreenService.ROLES.TEACHER
    });

    var bookmarkService = new BookmarkService();

    var backupService = new BackupService();

    var notificationService = new NotificationService();

    var trackingService = new TrackingService();

    new IndexedDBService('HiveClass').addObjectStores([
        {name: 'me', keyPath: 'id'},
        {name: 'configuration', keyPath: 'key'},
        {name: 'student', keyPath: 'email'},
        {name: 'classroom', keyPath: 'id'}
    ]).then(function(dbs) {

        var handlers = {
            storage: function handleStorageMessage(msg) {
                if (msg.id && msg.cmd && msg.type) {
                    var db = dbs[msg.type];
                    switch (msg.cmd) {
                        case 'save':
                            return db.create(msg.data)
                                .then(function () {
                                    return makeEmptyResponse(msg.id);
                                }, function (err) {
                                    return makeErrorResponse(msg.id, err);
                                });
                            break;
                        case 'update':
                            return db.update(msg.data)
                                .then(function () {
                                    return makeEmptyResponse(msg.id);
                                }, function (err) {
                                    return makeErrorResponse(msg.id, err);
                                });
                            break;
                        case 'get':
                            return db.get(msg.data)
                                .then(function (data) {
                                    return makeDataResponse(msg.id, data);
                                }, function (err) {
                                    return makeErrorResponse(msg.id, err);
                                });
                            break;
                        case 'dump':
                            return db.dump()
                                .then(function (data) {
                                    return makeDataResponse(msg.id, data);
                                }, function (err) {
                                    return makeErrorResponse(msg.id, err);
                                });
                            break;
                        case 'delete':
                            return db.delete(msg.data)
                                .then(function () {
                                    return makeEmptyResponse(msg.id);
                                }, function (err) {
                                    return makeErrorResponse(msg.id, err);
                                });
                            break;
                        case 'backup':
                            return db.dump()
                                .then(function(data) {
                                    return backupService.backup(msg.url, data);
                                })
                                .then(function() {
                                    return makeEmptyResponse(msg.id);
                                }, function(err) {
                                    return makeErrorResponse(msg.id, err);
                                });
                            break;
                        case 'restore':
                            return backupService.restore(msg.url)
                                .then(function(items) {
                                    var promises = [];
                                    for (var i = 0, itemsLength = items.length; i < itemsLength; i++) {
                                        promises.push(
                                            db.create(items[i])
                                                .then(function() {
                                                    return makeEmptyResponse(msg.id);
                                                }, function() {
                                                    db.update(items[i])
                                                        .then(function() {
                                                            return makeEmptyResponse(msg.id);
                                                        }, function(err) {
                                                            return makeErrorResponse(msg.id, err);
                                                        });
                                                })
                                        );
                                    }
                                    return Promise.all(promises);
                                });
                            break;
                        default:
                            console.log('Unknown storage message type: ' + msg.type);
                            return Promise.resolve(makeErrorResponse(msg.id, 'Unknown storage message type: ' + msg.type));
                            break;
                    }
                }
            },

            screen: function handleScreenMessage(msg) {
                if (msg.id && msg.cmd) {
                    switch (msg.cmd) {
                        case 'start':
                            return screenService.start(msg.port.sender.tab)
                                .then(function(stream) {
                                    return makeDataResponse(msg.id, stream);
                                }, function() {
                                    return makeDataResponse(msg.id, false);
                                });
                            break;
                        case 'capture':
                            var image = screenService.capture();
                            return Promise.resolve(makeDataResponse(msg.id, image));
                            break;
                        case 'stop':
                            screenService.stop();
                            return Promise.resolve(makeEmptyResponse(msg.id));
                            break;
                        default:
                            console.log('Unknown screen command: ' + msg.cmd);
                            return Promise.resolve(makeErrorResponse(msg.id, 'Unknown screen command: ' + msg.cmd));
                            break;
                    }
                }
            },

            bookmark: function handleBookmarkMessage(msg) {
                if (msg.id && msg.cmd) {
                    switch (msg.cmd) {
                        case 'listFolders':
                            return bookmarkService.listFolders()
                                .then(function(folders) {
                                    return makeDataResponse(msg.id, folders);
                                });
                            break;
                        case 'getBookmarks':
                            return bookmarkService.getBookmarks(msg.folderId)
                                .then(function(bookmarks) {
                                    return makeDataResponse(msg.id, bookmarks);
                                });
                            break;
                        case 'initializeFolder':
                            return bookmarkService.initializeFolder()
                                .then(function(bookmarkId) {
                                    return makeDataResponse(msg.id, bookmarkId);
                                });
                            break;
                        case 'createClassroomFolder':
                            return bookmarkService.createClassroomFolder(msg.name)
                                .then(function(bookmarkId) {
                                    return makeDataResponse(msg.id, bookmarkId);
                                });
                            break;
                    }
                }
            },

            notification: function handleNotificationMessage(msg) {
                if (msg.id && msg.cmd) {
                    switch (msg.cmd) {
                        case 'show':
                            return notificationService.show(msg.params)
                                .then(function() {
                                    return makeEmptyResponse(msg.id);
                                });
                            break;
                        case 'hide':
                            return notificationService.hide(msg.params.id)
                                .then(function() {
                                    return makeEmptyResponse(msg.id);
                                });
                            break;
                        case 'clear':
                            return notificationService.clear()
                                .then(function() {
                                    return makeEmptyResponse(msg.id);
                                });
                            break;
                    }
                }
            },

            tracking: function handleTrackingMessage(msg) {
                if (msg.id && msg.cmd) {
                    switch (msg.cmd) {
                        case 'save':
                            var savePromise;
                            var activity = {
                                id: msg.classroomId,
                                session: msg.session,
                                activity: msg.activities
                            };
                            if (activity.activity && activity.activity.length > 0) {
                                savePromise = trackingService.save(activity, msg.url)
                            } else {
                                savePromise = Promise.resolve();
                            }
                            return savePromise.then(function() {
                                return makeEmptyResponse(msg.id);
                            });
                            break;
                        case 'getPrevious':
                            return trackingService.getPrevious(msg.url)
                                .then(function(activity) {
                                    return makeDataResponse(msg.id, activity);
                                });
                            break;
                    }
                }
            },

            mesh: function handleMeshMessage(msg) {
                if (msg.id && msg.cmd) {
                    switch (msg.cmd) {
                        case 'check':
                            return new Promise(function(resolve) {
                                chrome.system.cpu.getInfo(function(info){
                                    resolve(info);
                                });
                            }).then(function(info) {
                                return makeDataResponse(msg.id, info);
                            });
                            break;
                        default:
                            console.log('Unknown mesh command:' + msg.cmd);
                            return Promise.resolve(makeErrorResponse(msg.id, 'Unknown mesh command: ' + msg.cmd));
                            break;
                    }
                }
            }
        };

        var onConnect = function (port) {
            var onMessage = function (msg) {
                var handler = handlers[msg.channel];
                if (handler) {
                    msg.port = port;
                    handler(msg)
                        .then(function (response) {
                            port.postMessage(response);
                        });
                    return true;
                } else {
                    port.postMessage(makeErrorResponse(msg.id, 'No handler for this channel: ' + msg.channel));
                    console.log('Unknown channel:', msg.channel);
                }
            };
            port.onMessage.addListener(onMessage);

            var onDisconnect = function () {
                port.onMessage.removeListener(onMessage);
                port.onDisconnect.removeListener(onDisconnect);
            };
            

            port.onDisconnect.addListener(onDisconnect);
        };

        chrome.runtime.onConnect.addListener(onConnect);
        chrome.runtime.onConnectExternal.addListener(onConnect);

        var loginUrl = configuration.application.url.replace(/[a-z]+$/, 'login');

        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            if ((tab.url.indexOf(configuration.application.url) === 0 || tab.url.indexOf(loginUrl) === 0) && changeInfo.status === 'complete') {
                chrome.tabs.executeScript(tab.id, {file: "js/vendor/require.js"}, function () {
                    chrome.tabs.executeScript(tab.id, {file: "common/js/messageHandler.js"});
                });
            }
        });

        chrome.tabs.query({ url: configuration.application.url+'*' }, function(tabs) {
            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                chrome.tabs.executeScript(tab.id, {file: "js/vendor/require.js"}, function () {
                    chrome.tabs.executeScript(tab.id, {file: "common/js/messageHandler.js"});
                });
            }
        });
        chrome.tabs.query({ url: loginUrl+'*' }, function(tabs) {
            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                chrome.tabs.executeScript(tab.id, {file: "js/vendor/require.js"}, function () {
                    chrome.tabs.executeScript(tab.id, {file: "common/js/messageHandler.js"});
                });
            }
        });
    });
});
