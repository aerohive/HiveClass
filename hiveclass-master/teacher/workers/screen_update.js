var DEFAULT_FPS = 2;
var ScreenUpdateService = function() {
    this._interval = null;

    this.start = function(fps) {
        fps = fps || DEFAULT_FPS;
        this.stop();
        this._interval = setInterval(function() {
            postMessage({ cmd: 'refresh' });
        }, 1000 / fps)
    };

    this.stop = function() {
        if (this._interval) {
            clearInterval(this._interval);
        }
    };
};

var screenUpdateService = new ScreenUpdateService();

onmessage = function(message) {
    switch (message.data.cmd) {
        case 'start':
            screenUpdateService.start(message.data.fps);
            break;
        case 'stop':
            screenUpdateService.stop();
            break;
        default:
            console.log('[WORKER] Invalid ScreenUpdateService command:', message.data.cmd);
            break;
    }
};
