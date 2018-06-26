/**
 * @module ui/main.reel
 * @requires montage/ui/component
 */
var Target = require("montage/core/target").Target,
    UUID = require("montage/core/uuid"),
    ExtensionConfiguration = require("../../configuration/extension-configuration").ExtensionConfiguration,
    LruMap = require("collections/lru-map");


/**
 * @class Main
 * @extends Component
 */
exports.ExtensionBridge = Target.specialize(/** @lends Main# */ {


    constructor: {
        value: function Main() {
            this.super();
            this._handlerPool = new LruMap(null, 256);
            this.connectToExtension();
        }
    },


    connectionPort: {
        value: null
    },


    _handlerPool: {
        value: null
    },


    connectToExtension: {
        value: function () {
            if (chrome) {
                this.connectionPort = chrome.runtime.connect(ExtensionConfiguration.EXTENSION_ID);

                var self = this,
                    callBackFunction = function (message) {
                        self.handleExtensionMessage(message);
                    };

                this.connectionPort.onMessage.addListener(callBackFunction);

            } //todo catch error or missing extension
        }
    },


    handleExtensionMessage: {
        value: function (message) {
            if (message) {
                var deserialized = JSON.parse(message);

                if (deserialized.handler) {
                    var handler = this._handlerPool.get(deserialized.handler);

                    if (handler) {
                        handler.call(handler, deserialized.error, deserialized.data);
                    } else {
                        console.warn("handler unknown");
                    }
                } else if (deserialized.event) {
                    this.dispatchEventNamed(deserialized.event, true, true, deserialized.detail);

                } else {
                    console.warn("message unknown");
                }
            }
        }
    },


    invoke: {
        value: function (service, method, args, callBack) {
            if (!callBack) {
                if (typeof args !== "function") {
                    throw new Error("need handler");
                }

                callBack = args;
            }

            var uuid = UUID.generate(),

                message = JSON.stringify({
                    origin: uuid,
                    service: service,
                    method: method,
                    arguments: args
                });

            this._handlerPool.set(uuid, callBack);

            this._sendMessage(message);
        }
    },


    _sendMessage: {
        value: function (message) {
            this.connectionPort.postMessage(message);
        }
    },

    dispatchEventExtension: {
        value: function (eventName, detail) {
            var message = JSON.stringify({
                event: eventName,
                detail: detail
            });

            this._sendMessage(message);
        }
    }


});
