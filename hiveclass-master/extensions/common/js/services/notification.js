define(['bluebird'], function(Promise) {
    var NotificationService = function() {
        this.show = function(params) {
            return new Promise(function(resolve) {
                chrome.notifications.create(params.id, {
                    type: 'basic',
                    iconUrl: chrome.runtime.getManifest().icons[48],
                    title: params.title,
                    message: params.message,
                    priority: 2
                }, function() {
                    resolve();
                });
            });
        };

        this.hide = function(id) {
            return new Promise(function(resolve) {
                chrome.notifications.clear(id, function() {
                    resolve();
                });
            });
        };

        this.clear = function() {
            return new Promise(function(resolve) {
                chrome.notifications.getAll(function(notifications) {
                    resolve(Object.keys(notifications));
                });
            })
            .then(function(notifications) {
                for (var i = 0, length = notifications.length; i < length; i++) {
                    chrome.notifications.clear(notifications[i]);
                }
            });
        }
    };

    return NotificationService;
});
