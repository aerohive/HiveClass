define(function() {
    var ShowScreenService = function(config) {
        var config = config || {};
        this._started = false;
        this.compressionLevel = config.compressionLevel || 0.85;
        this.captureWidth = config.captureWidth || 1920;
        this.desktopMedia = config.desktopMedia || ["screen"];
        this.video = document.querySelector('video');
        this.canvas = document.querySelector('canvas');
        this.captureId = null;
        this.desktopStream = null;
        this.captureWidth = Math.min(screen.width, this.captureWidth);
        this.role = config.role || ShowScreenService.ROLES.STUDENT;

        this._startCapturingDesktop = function (tab) {
            var self = this;
            return new Promise(function(resolve, reject) {
                if (!self.consentScreenDisplayed) {
                    self.consentScreenDisplayed = true;
                    self.captureId = chrome.desktopCapture.chooseDesktopMedia(self.desktopMedia, tab, function (streamId) {
                        self.consentScreenDisplayed = false;
                        if (streamId) {
                            resolve({ streamId: streamId });
                        } else {
                            self._started = false;
                            reject();
                        }
                    });
                } else {
                    reject();
                }
            });
        };

        this._stopCapturingDesktop = function () {
            if (this.captureId) {
                this.consentScreenDisplayed = false;
                chrome.desktopCapture.cancelChooseDesktopMedia(this.captureId);
            }
            if (this.desktopStream) {
                this.desktopStream.stop();
            }
        };

        this.start = function(tab, endScreenSharingHandler) {
            this._started = true;
            this._endScreenSharingHandler = endScreenSharingHandler;
            return this._startCapturingDesktop(tab);
        };

        this.capture = function() {
            var dataURL;
            if (this.desktopStream) {
                this.canvas.width = this.video.width = this.captureWidth;
                this.canvas.height = this.video.clientHeight;
                var ctx = this.canvas.getContext('2d');
                ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                dataURL = this.canvas.toDataURL('image/webp', this.compressionLevel);
            }
            return dataURL;
        };

        this.stop = function() {
            this._stopCapturingDesktop();
            this._started = false;
        };

        this.isStarted = function isStarted() {
            return this._started;
        };
    };

    ShowScreenService.ROLES = {
        STUDENT: 'STUDENT',
        TEACHER: 'TEACHER'
    };


    return ShowScreenService;
});
