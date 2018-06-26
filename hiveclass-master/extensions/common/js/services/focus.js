var FULLSCREEN = 'fullscreen',
    STATE_FULLSCREEN = { state: FULLSCREEN },
    STATE_MAXIMIZED = { state: 'maximized' },
    FOCUSED = { focused: true },
    POPULATE = { populate: true },
    NO_POPULATE = { populate: false };

define(['bluebird'], function(Promise) {
    var FocusService = function() {
        this._resourceUrl = null;
        this._window = null;
        this._started = false;
        this._locked = false;
        this._resizeInterval = null;
        var self = this;

        this._lockRemoval = function(windowId) {
            if (self._window && self._window.id == windowId) {
                self._unlockEverything()
                    .then(function() {
                        self._openResource(true);
                    });
            }
        };

        this._ensureTabWithIdExists = function(tabId) {
            return new Promise(function(resolve, reject) {
                chrome.tabs.query({}, function (allTabs) {
                    var tabs = allTabs.filter(function (x) { return x.id === tabId; });
                    if (tabs.length == 1) {
                        resolve(tabs[0]);
                    } else {
                        reject();
                    }
                });
            });
        };

        this._ensureFocusWindowExists = function() {
            return new Promise(function(resolve, reject) {
                if (self._window) {
                    chrome.windows.getAll(NO_POPULATE, function (_windows) {
                        var focusWindows = _windows.filter(function (x) { return x.id === self._window.id; });
                        if (focusWindows.length == 1) {
                            resolve(focusWindows[0]);
                        } else {
                            reject();
                        }
                    });
                } else {
                    reject();
                }
            });
        };

        this._lockFocus = function(windowId) {
            setTimeout(function() {
                if (self._window && self._window.id != windowId) {
                    self._ensureFocusWindowExists()
                        .then(function (_window) {
                            chrome.windows.update(_window.id, FOCUSED);
                        }, function() {});
                }
            }, 0);
        };

        this._lockUpdate = function(tabId, changeInfo, tab) {
            if (changeInfo.url && changeInfo.url.split('#')[0] != self._resourceUrl.split('#')[0]) {
                chrome.tabs.update(tabId, { url: self._resourceUrl });
            } else if (changeInfo.url) {
                self._resourceUrl = changeInfo.url;
            }
        };

        this._lockNewTab = function(tab) {
            self._ensureTabWithIdExists(tab.id)
                .then(function(_tab) {
                    chrome.tabs.remove(_tab.id);
                }, function() {});
        };

        this._lockNewWindow = function(_window) {
            chrome.windows.remove(_window.id);
        };

        this._lockResize = function() {
            self._unlockResize();
            self._resizeInterval = setInterval(function() {
                self._ensureFocusWindowExists()
                    .then(function (_window) {
                        if (self._locked && _window.state != FULLSCREEN) {
                            chrome.windows.update(_window.id, STATE_FULLSCREEN);
                        }
                    }, function() {});
            }, 100);
        };

        this._unlockResize = function() {
            if (self._resizeInterval) {
                clearInterval(self._resizeInterval);
                self._resizeInterval = null;
            }
        };

        this._ensureEventHasListener = function(event, listener) {
            if (!event.hasListener(listener)) {
                event.addListener(listener);
            }
        };

        this._ensureEventHasNotListener = function(event, listener) {
            if (event.hasListener(listener)) {
                event.removeListener(listener);
            }
        };

        this._lockEverything = function() {
            return new Promise(function(resolve) {
                self._ensureEventHasListener(chrome.windows.onFocusChanged, self._lockFocus);
                self._ensureEventHasListener(chrome.windows.onRemoved, self._lockRemoval);
                self._ensureEventHasListener(chrome.windows.onCreated, self._lockNewWindow);
                self._ensureEventHasListener(chrome.tabs.onUpdated, self._lockUpdate);
                self._ensureEventHasListener(chrome.tabs.onCreated, self._lockNewTab);
                self._lockResize();
                self._locked = true;
                resolve();
            });
        };

        this._unlockEverything = function() {
            return new Promise(function(resolve) {
                self._ensureEventHasNotListener(chrome.windows.onFocusChanged, self._lockFocus);
                self._ensureEventHasNotListener(chrome.windows.onRemoved, self._lockRemoval);
                self._ensureEventHasNotListener(chrome.windows.onCreated, self._lockNewWindow);
                self._ensureEventHasNotListener(chrome.tabs.onUpdated, self._lockUpdate);
                self._ensureEventHasNotListener(chrome.tabs.onCreated, self._lockNewTab);
                self._unlockResize();
                self._locked = false;
                resolve();
            });
        };

        this._openInExistingWindow = function() {
            return new Promise(function(resolve) {
                chrome.windows.get(self._window.id, POPULATE, function(_window) {
                    if (_window) {
                        self._unlockEverything()
                            .then(function() {
                                chrome.tabs.update(_window.tabs[0].id, {
                                    url: self._resourceUrl
                                }, function() {
                                    self._lockEverything(_window)
                                        .then(function() {
                                            resolve();
                                        });
                                });
                            });
                    } else {
                        self._openResource()
                            .then(function() {
                                resolve();
                            });
                    }
                });
            });
        };

        this._openInNewWindow = function() {
            return new Promise(function(resolve) {
                chrome.windows.create({
                    url: self._resourceUrl,
                    focused: true
                }, function(newWindow) {
                    chrome.windows.update(newWindow.id, STATE_FULLSCREEN, function(_window) {
                        self._window = _window;
                        self._lockEverything(_window)
                            .then(function() {
                                resolve();
                            });
                    });
                })
            })
        };

        this._openResource = function(inNewWindow) {
            if (!inNewWindow && self._window) {
                return this._openInExistingWindow();
            } else {
                return this._openInNewWindow();
            }
        };

        this.start = function() {
            this._openResource()
                .then(function() {
                    self._started = true;
                });
        };

        this.stop = function() {
            this._unlockEverything()
                .then(function() {
                    self._started = false;
                    chrome.windows.update(self._window.id, STATE_MAXIMIZED);
                    self._window = null;
                });
        };

        this.isStarted = function() {
            return this._started;
        };

        this.setResource = function(resourceUrl) {
            this._resourceUrl = resourceUrl;
            if (this._started) {
                this._openResource();
            }
        };
    };

    return FocusService;
});
