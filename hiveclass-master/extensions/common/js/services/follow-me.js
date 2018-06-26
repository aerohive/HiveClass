define(['bluebird'], function(Promise) {
    var FollowMeService = function(url, lock) {
        this._url = url;
        this._lock = lock;
        this._started = false;
        this._lockInterval = null;
        var self = this;

        this._lockTab = function _lockTab() {
            if (self. isStarted() && self._tab.id) {
                chrome.tabs.get(self._tab.id, function(tab) {
                    if (tab) {
                        chrome.tabs.update(self._tab.id, { highlighted: true });
                    } else {
                        self.stop();
                    }
                });
            } else {
                self.stop();
            }
        };

        this._lockWindowFocus = function _lockWindow() {
            if (self.isStarted() && self._tab.windowId) {
                chrome.windows.get(self._tab.windowId, function(window) {
                    if (window) {
                        chrome.windows.update(self._tab.windowId, { focused: true, state: 'fullscreen' });
                    } else {
                        self.stop();
                    }
                });
            } else {
                self.stop();
            }
        };

        this._unlockWindow = function _unlockWindow() {
            if (self._tab.windowId) {
                chrome.windows.get(self._tab.windowId, function(window) {
                    if (window) {
                        chrome.windows.update(self._tab.windowId, { state: 'normal' });
                    }
                });
            }
        };

        this.start = function() {
            return new Promise(function(resolve) {
                if (!self._started) {
                    self._started = true;
                    self._lockTab();
                    self._lockWindowFocus();
                    if (self._lock) {
                        self._lockInterval = setInterval(function() {
                            self._lockWindowFocus()
                        }, 125);
                        chrome.tabs.onActiveChanged.addListener(self._lockTab);
                        chrome.windows.onFocusChanged.addListener(self._lockWindowFocus);
                    }
                }
                resolve();
            });
        };

        this.stop = function() {
            return new Promise(function(resolve) {
                clearInterval(self._lockInterval);
                self._lockInterval = null;
                chrome.tabs.onActiveChanged.removeListener(self._lockTab);
                chrome.windows.onFocusChanged.removeListener(self._lockWindowFocus);
                self._unlockWindow();
                self._started = false;
                resolve();
            });
        };

        this.isStarted = function isStarted() {
            return this._started;
        };

        return new Promise(function(resolve) {
            chrome.tabs.query({ url: url.split('#')[0] }, function(tabs) {
                if (tabs.length > 0) {
                    self._tab = tabs.filter(function(x) { return x.url == url; })[0];
                    resolve(self);
                } else {
                    chrome.tabs.create({ url: url, active: true }, function(tab) {
                        self._tab = tab;
                        resolve(self);
                    });
                }
            });
        });

    };

    return FollowMeService;
});
