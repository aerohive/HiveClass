define(['bluebird'], function(Promise) {
    var TabService = function() {
        this.list = function() {
            return new Promise(function(resolve) {
                chrome.tabs.query({}, function(tabs) {
                    resolve(tabs.map(function(x) {
                        return {
                            id: x.id,
                            title: x.title,
                            url: x.url,
                            favicon: x.favicon
                        };
                    }));
                });
            });
        };

        this.close = function(tabId) {
            return new Promise(function(resolve) {
                chrome.tabs.remove(tabId, function() {
                    resolve();
                });
            })
        };

        this.closeAllExceptUrl = function(url) {
            return new Promise(function(resolve) {
                chrome.tabs.query({ url: url }, function(tabs) {
                    resolve(tabs.map(function(tab) { return tab.id; }));
                });
            }).then(function(allowedTabs) {
                return new Promise(function(resolve) {
                    chrome.tabs.query({}, function(allTabs) {
                        resolve({ allowed: allowedTabs, all: allTabs.map(function(tab) { return tab.id; }) });
                    });
                });
            }).then(function(tabsGroups) {
                for (var i = 0; i < tabsGroups.all.length; i++) {
                    var tabId = tabsGroups.all[i];
                    if (tabsGroups.allowed.indexOf(tabId) === -1) {
                        chrome.tabs.remove(tabId);
                    }
                }
            });
        };
    };

    return TabService;
});