requirejs.config({
    baseUrl: 'js',
    paths: {
        indexedDB: '../common/js/services/indexedDB',
        screen: '../common/js/services/screen',
        followMe: '../common/js/services/follow-me',
        focus: '../common/js/services/focus',
        tab: '../common/js/services/tab',
        notification: '../common/js/services/notification',
        information: '../common/js/services/information',
        tracking: '../common/js/services/tracking',
        bluebird: './vendor/bluebird'
    }
});

requirejs(['indexedDB', 'screen', 'followMe', 'focus', 'tab', 'notification', 'information', 'tracking', 'configuration'], function(IndexedDBService, ScreenService, FollowMeService, FocusService, TabService, NotificationService, InformationService, TrackingService, configuration) {
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

    var endScreenSharingHandlerBuilder = function(port) {
        return function() {
            try {
                port.postMessage({ type: 'screen', cmd: 'endShare' });
            } catch (error) {
            }
        };
    };

    var screenService = new ScreenService({
        compressionLevel: 0.85,
        captureWidth: 1920
    });

    var focusService = new FocusService();

    var tabService = new TabService();

    var notificationService = new NotificationService();

    var informationService = new InformationService();

    var trackingService = new TrackingService();

    var followMeService = null;

    new IndexedDBService('HiveClass').addObjectStores([
        {name: 'me', keyPath: 'id'},
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
                        default:
                            var error = 'Unknown storage message type: ' + msg.type;
                            console.log(error);
                            return Promise.reject(makeErrorResponse(msg.id, error));
                            break;
                    }
                }
            },

            screen: function handleScreenMessage(msg, sender) {
                if (msg.id && msg.cmd) {
                    switch (msg.cmd) {
                        case 'start':
                            return screenService.start(msg.port.sender.tab, endScreenSharingHandlerBuilder(msg.port))
                                .then(function(stream) {
                                    return makeDataResponse(msg.id, stream);
                                }, function() {
                                    return makeDataResponse(msg.id, false);
                                });
                            break;
                        case 'capture':
                            return Promise.resolve(makeDataResponse(msg.id, screenService.capture()));
                            break;
                        case 'stop':
                            screenService.stop();
                            return Promise.resolve(makeEmptyResponse(msg.id));
                            break;
                        case 'status':
                            return Promise.resolve(makeDataResponse(msg.id, screenService.isStarted()));
                            break;
                        default:
                            var error = 'Unknown screen command: ' + msg.cmd;
                            console.log(error);
                            return Promise.reject(makeErrorResponse(msg.id, error));
                            break;
                    }
                }
            },

            'follow-me': function handleFollowMeMessage(msg) {
                if (msg.id && msg.cmd) {
                    switch (msg.cmd) {
                        case 'start':
                            var startPromise;
                            if (!followMeService) {
                                startPromise = new FollowMeService(msg.url, msg.lock)
                                    .then(function(service) {
                                        followMeService = service;
                                        return followMeService.start();
                                    });
                            } else {
                                startPromise = Promise.resolve();
                            }
                            return startPromise
                                .then(function() {
                                    return makeEmptyResponse(msg.id);
                                });
                            break;
                        case 'stop':
                            var stopPromise;
                            if (followMeService) {
                                stopPromise = followMeService.stop();
                            } else {
                                stopPromise = Promise.resolve();
                            }
                            followMeService = null;
                            return stopPromise
                                .then(function() {
                                    return makeEmptyResponse(msg.id);
                                });
                            break;
                    }
                }
            },

            focus: function handleFocusMessage(msg) {
                if (msg.id && msg.cmd) {
                    switch (msg.cmd) {
                        case 'start':
                            focusService.setResource(msg.resources[0]);
                            if (!focusService.isStarted()) {
                                focusService.start();
                            }
                            return Promise.resolve(makeEmptyResponse(msg.id));
                            break;
                        case 'stop':
                            if (focusService.isStarted()) {
                                focusService.stop();
                            }
                            return Promise.resolve(makeEmptyResponse(msg.id));
                            break;
                    }
                }
            },

            tab: function handleTabMessage(msg) {
                if (msg.id && msg.cmd) {
                    switch (msg.cmd) {
                        case 'list':
                            return tabService.list()
                                .then(function(tabs) {
                                    return makeDataResponse(msg.id, tabs);
                                });
                            break;
                        case 'close':
                            return tabService.close(msg.tabId)
                                .then(function() {
                                    tabService.list()
                                })
                                .then(function(tabs) {
                                    return makeDataResponse(msg.id, tabs);
                                });
                            break;
                        case 'closeAllExceptMe':
                            return tabService.closeAllExceptUrl(configuration.application.url + '*')
                                .then(function() {
                                    return makeEmptyResponse(msg.id);
                                });
                            break;
                    }
                }
            },

            notification: function handleNotificationMessage(msg) {
                if (msg.id && msg.cmd) {
                    switch (msg.cmd) {
                        case 'show':
                            return notificationService.show(msg.params);
                            break;
                        case 'hide':
                            return notificationService.hide(msg.params.id);
                            break;
                    }
                }
            },

            information: function handleInformationsMessage(msg) {
                if (msg.id && msg.cmd) {
                    switch (msg.cmd) {
                        case 'dump':
                            return informationService.dump()
                                .then(function(information) {
                                    return makeDataResponse(msg.id, information);
                                });
                            break;
                    }
                }
            },

            tracking: function handleTrackingMessage(msg) {
                if (msg.id && msg.cmd) {
                    switch (msg.cmd) {
                        case 'start':
                            return trackingService.start(msg.port)
                                .then(function() {
                                    return makeEmptyResponse(msg.id);
                                });
                            break;
                        case 'stop':
                            return trackingService.stop()
                                .then(function() {
                                    return makeEmptyResponse(msg.id);
                                });
                            break;
                        default:
                            console.log('Unknown cmd for channel', msg.channel, msg.cmd, msg);
                            break;
                    }
                }
            },

            cpuCheck: function handleCpuCheckMessage(msg) {
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
                            console.log('Unknown cmd for channel', msg.channel, msg.cmd, msg);
                            break;
                    }
                }
            }
        };

        var onConnect = function (port) {
            var onMessage = function (msg, sender) {
                var handler = handlers[msg.channel];
                if (handler) {
                    msg.port = port;
                    handler(msg, sender)
                        .then(function (response) {
                            port.postMessage(response);
                        });
                    return true;
                } else {
                    console.log('Unknown channel:', msg.channel);
                }
            };
            port.onMessage.addListener(onMessage);

            var onDisconnect = function () {
                port.onMessage.removeListener(onMessage);
                port.onDisconnect.removeListener(onDisconnect);
                if (followMeService && followMeService.isStarted()) {
                    followMeService.stop();
                }
                if (focusService && focusService.isStarted()) {
                    focusService.stop();
                }
                if (screenService && screenService.isStarted()) {
                    screenService.stop();
                }
                if (trackingService && trackingService.isStarted()) {
                    trackingService.stop();
                }
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
