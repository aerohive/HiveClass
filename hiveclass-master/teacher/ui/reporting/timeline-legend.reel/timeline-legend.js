var Component = require("montage/ui/component").Component;

exports.TimelineLegend = Component.specialize({

    startTime: {
        value: null
    },

    endTime: {
        value: null
    },

    _updateInterval: {
        value: null
    },

    timelineLegendMain: {
        value: null
    },

    detailsRep: {
        value: null
    },

    validatedActivity: {
        value: null
    },

    colorElement: {
        value: null
    },

    _urlPattern: {
        value: new RegExp(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/)
    },

    enterDocument: {
        value: function (isFirstTime) {
            if (isFirstTime) {
                window.addEventListener("resize", this, false);
                this._updateDetails();
            }
            this.colorElement.style.background = this.activity.background;
            this._updateInterval = setInterval(this._updateDetails.bind(this), 3000);
        }
    },

    exitDocument: {
        value: function () {
            if (this._updateInterval) {
                clearInterval(this._updateInterval);
                this._updateInterval = null;
            }
        }
    },

    _updateDetails: {
        value: function () {
            this._removeInvalidUrls(this.activity.details);
            this.startTime = this.application.reportingService.convertTime(this.activity.start);
            this.endTime = this.application.reportingService.convertTime(this.activity.end);
        }
    },

    prepareForActivationEvents: {
        value: function () {
            var self = this;
            this.element.addEventListener("click", function (event) {
                self.handleTimelineLegendClick(event);
            }, false);
        }

    },

    handleTimelineLegendClick: {
        value: function (event) {
            var url;
            if (event.target && event.target.component) {
                url = event.target.component.value;
            }
            if (event.target == this.timelineLegendMain) {
                this.detailsRep.classList.toggle('hidden');
            } 
        }
    },

    _removeInvalidUrls: {
        value: function (activity) {
            for (var i = 0; i < activity.length; i++) {
                if (this._isValidUrl(activity[i])) {
                    this.validatedActivity = this.activity.details;
                } else {
                    this.timelineLegendMain.classList.remove('TimelineLegend-main');
                }
            }
        }
    },

    _isValidUrl: {
        value: function (str) {
            return this._urlPattern.test(str);
        }
    }
    
});
