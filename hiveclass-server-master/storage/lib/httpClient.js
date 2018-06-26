var Promise = require('bluebird');

exports.HttpClient = function(request) {
    request = request || require('request');

    this.get = function(url, options) {
        options = options || {};

        return new Promise(function(resolve, reject) {
            var httpRequest = request.get(url, function(err, response) {
                if (err) return reject(err);
                resolve(response);
            });
            if (options.accessToken) {
                httpRequest.auth(null, null, true, options.accessToken);
            }
        });
    };
};