define(['bluebird'], function(Promise) {
    var BackupService = function() {
        this.backup = function(url, data) {
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.addEventListener('load', function() {
                    resolve();
                });
                xhr.open('POST', url);
                xhr.setRequestHeader('content-type', 'application/json');
                xhr.send(JSON.stringify(data));
            });
        };

        this.restore = function(url) {
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.addEventListener('load', function() {
                    resolve(JSON.parse(this.response).content);
                });
                xhr.open('GET', url);
                xhr.setRequestHeader('content-type', 'application/json');
                xhr.send();
            });
        };
    };

    return BackupService;
});
