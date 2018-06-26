var Target = require("montage/core/target").Target,
    UUID = require("montage/core/uuid"),
    LruMap = require("collections/lru-map");

exports.WebSocketClient = Target.specialize(/** @lends ApplicationDelegate# */ {
    constructor: {
        value: function WebSocketClient() {
            this.super();

            this._handlerPool = new LruMap(null, 256);
        }
    },


    _socket: {
        value: null
    },


    _handlerPool: {
        value: null
    },

    connect: {
        value: function (callBack) {
            //this._socket = new WebSocket("ws://" + window.location.host);
            this._socket = new WebSocket("ws://localhost:8888");
            this._addListeners();
        }
    },

    _addListeners: {
        value: function () {
            var self = this;

            this._socket.onerror = function (errorEvent) {
                self._handleErrorConnection(errorEvent);
            };

            this._socket.onopen = function (openEvent) {
                self._handleOpenConnection(openEvent);

                self._socket.onmessage = function (messageEvent) {
                    self._handleMessage(messageEvent);
                };

                self._socket.onclose = function (closeEvent) {
                    self._handleCloseConnection(closeEvent);
                };
            };
        }
    },

    _sendMessage: {
        value: function (message) {
            var error;

            if (this._socket && this._socket.readyState === 1) {
                if (typeof message !== "string") {
                    try {
                        message = JSON.stringify(message);
                    } catch (e) {
                        error = e;
                        message = null;
                    }
                }

                if (message) {
                    this._socket.send(message);
                }
            } else {
                error = new Error("Connection is closed");
            }

            if (error) {
                this.dispatchEventNamed("connectionError", true, true, {event: error});
            }
        }
    },

    invoke: {
        value: function (service, method, args, callBack) {
            var uuid = UUID.generate(),
                message = {
                    origin: uuid,
                    service: service,
                    method: method,
                    arguments: args // verification done on backend side
                };

            this._handlerPool.set(uuid, callBack);
            this._sendMessage(message);
        }
    },

    _handleMessage: {
        value: function (event) {
            if (event.data) {
                var deserialised = JSON.parse(event.data);

                // todo change handler mechanism by just a event type mechanism
                if (deserialised.handler) {
                    var handler = this._handlerPool.get(deserialised.handler);

                    if (handler) {
                        handler.call(handler, deserialised.error, deserialised.data);
                    } else {
                        console.warn("handler unknown: " + handler);
                    }

                } else if (deserialised.event) {
                    this.dispatchEventNamed(deserialised.event, true, true, deserialised.detail);

                } else {
                    console.warn("message unknown");
                }
            }
        }
    },

    _handleErrorConnection: {
        value: function (event) {
            this.dispatchEventNamed("connectionError", true, true, {event: event});
        }
    },

    _handleOpenConnection: {
        value: function (event) {
            this.dispatchEventNamed("connectionReady", true, true, {event: event});

        }
    },

    _handleCloseConnection: {
        value: function (event) {
            // todo implement a way to restart the connection
            this.dispatchEventNamed("connectionClosed", true, true, {event: event});
        }
    }

});
