define(['bluebird'], function(Promise) {
    var TrackingService = function() {
        this._checkIntervalId = null;
        this._lastFocusedUrl = '';
        this._isStarted = false;
        this._port = null;

        this._checkFocusedTab = function() {
            return new Promise(function(resolve) {
                chrome.windows.getLastFocused({populate: true}, function(window) {
                    if (window.focused) {
                        chrome.tabs.query({
                            windowId: window.id,
                            active: true
                        }, function(tabs) {
                            resolve(tabs[0].url);
                        });
                    } else {
                        resolve('NATIVE');
                    }
                });
            });
        };

        this.start = function(port) {
            var self = this;
            this._port = port;
            self._checkFocusedTab()
                .then(function(url) {
                    var timestamp = Math.round(Date.now()/1000);
                    self._port.postMessage({
                        type: 'tracking',
                        event: {
                            timestamp: timestamp,
                            url: url
                        }
                    });
                    self._lastFocusedUrl = url;
                });
            this._checkIntervalId = setInterval(function() {
                self._checkFocusedTab()
                    .then(function(url) {
                        if (url != self._lastFocusedUrl) {
                            self._port.postMessage({
                                type: 'tracking',
                                event: {
                                    url: url
                                }
                            });
                            self._lastFocusedUrl = url;
                        }
                    });
            }, 500);
            this._isStarted = true;
            return Promise.resolve();
        };

        this.stop = function() {
            if (this._checkIntervalId !== null) {
                clearInterval(this._checkIntervalId)
            }
            this._isStarted = false;
            return Promise.resolve();
        };

        this.isStarted = function() {
            return this._isStarted;
        };

        this.save = function(activities, url) {
            return new Promise(function(resolve) {
                var xhr = new XMLHttpRequest();
                xhr.addEventListener('load', function() {
                    resolve();
                });
                xhr.open('POST', url);
                xhr.setRequestHeader('content-type', 'application/json');
                xhr.send(JSON.stringify(activities));
            });
        };

        this.getPrevious = function(url) {
            return new Promise(function(resolve) {
                var xhr = new XMLHttpRequest();
                xhr.addEventListener('load', function() {
                    var content;
                    if (this.status === 200) {
                        content = JSON.parse(this.response).content;
                    }
                    resolve(content);
                });
                xhr.open('GET', url);
                xhr.setRequestHeader('content-type', 'application/json');
                xhr.send();
            });
        }
    };

    return TrackingService;
});
