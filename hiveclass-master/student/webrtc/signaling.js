var SignalingService = function(config) {
    this.role = config.role;
    this.endpoint = config.endpoint;
    this.peerId = config.peerId;
    this.onopenHandler = config.onopen;
    this.onmessageHandler = config.onmessage;
    this._isOpen = false;
    var self = this;

    this.init = function(callback) {
        this._stopPing();
        this.signalingChannel = new WebSocket(this.endpoint);
        var self = this;
        this.signalingChannel.onopen = function register() {
            self._isOpen = true;
            self.signalingChannel.send(JSON.stringify({ type: 'register', peerId: self.peerId, role: self.role }));
            self.pingInterval = setInterval(function() {
                self.ping()
            }, 10000);
            if (callback) {
                callback();
            }
            if (self.onopenHandler && typeof self.onopenHandler === 'function') {
                self.onopenHandler(self);
            }
        };

        this.signalingChannel.onmessage = function(event) {
            self.onmessageHandler(event.data);
        };

        this.signalingChannel.onclose = function() {
            self._isOpen = false;
            self._stopPing();
            if (event.code != 1000 || !JSON.parse(event.reason).data.locked) {
                console.log('Connection lost, retrying to connect in 10000 ms.');
                setTimeout(function() {
                    self.init();
                }, 10000);
            }
        }
    };

    this.ping = function() {
        if (this.signalingChannel.readyState > 1) {
            this.init();
        } else if (this.signalingChannel.readyState == 1) {
            this.signalingChannel.send(JSON.stringify({type: 'ping'}));
        }
    };

    this._makeMessage = function (payload, serverId, type) {
        return JSON.stringify({ peerId: this.peerId, src: this.role, type: type, serverId: serverId, data: payload });
    };

    this.send = function(payload, serverId, type) {
        var message = this._makeMessage(payload, serverId, type);
        if (this.signalingChannel.readyState == 1) {
            this.signalingChannel.send(message);
        } else {
            if (this.signalingChannel.readyState > 1) {
                this.open(function() {
                    self.signalingChannel.send(message);
                })
            } else {
                setTimeout(function() {
                    self.signalingChannel.send(message);
                }, 1000);
            }
        }
    };

    this._stopPing = function () {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    };

    this.close = function() {
        if (this._isOpen) {
            this._isOpen = false;
            this._stopPing();
            this.signalingChannel.onclose = null;
            this.signalingChannel.send(JSON.stringify({ type: 'unregister', peerId: this.peerId, role: this.role }));
            this.signalingChannel.close();
        }
    };

    this.open = function(callback) {
        this.init(callback);
    };

    this.init();
};
