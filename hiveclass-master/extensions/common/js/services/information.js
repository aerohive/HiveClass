define(['bluebird'], function(Promise) {
    var InformationService = function() {
        this.dump = function() {
            var information = {};
            return new Promise(function(resolve) {
                    chrome.system.cpu.getInfo(function(info) {
                        information['cpu'] = info;
                        resolve();
                    });
                }).then(function() {
                    return new Promise(function(resolve) {
                        chrome.system.memory.getInfo(function(info) {
                            information['memory'] = info;
                            resolve();
                        });
                    })
                }).then(function() {
                    return new Promise(function(resolve) {
                        chrome.management.getAll(function(extensions) {
                            information['extensions'] = extensions;
                            resolve(information);
                        });
                    });
                });
        }
    };

    return InformationService;
});
