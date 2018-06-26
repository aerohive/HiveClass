/**
 * @module ui/main.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    ExtensionService = require("common/core/extension-service").ExtensionService;

/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main# */ {

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                var extensionService = new ExtensionService();

                window.addEventListener("message", function (event) {
                    var msg = event.data;
                    if (msg && msg.target === 'application' && msg.payload) {
                        extensionService.handleMessage.call(extensionService, msg.payload);
                    }
                });

                var message = {
                    cmd: 'get',
                    type: 'me',
                    data: 'remote'
                };
                extensionService.send('storage', message)
                    .then(function(transaction) {
                        var profile = transaction.response.data;
                        if (profile && profile.tokens && profile.tokens.refresh) {
                            document.cookie = 'hiveclass-refresh=' + profile.tokens.refresh + ';Max-age=300;Path=/auth';
                        }
                    });
            }
        }
    }
});
