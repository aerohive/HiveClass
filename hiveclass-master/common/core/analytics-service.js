var Montage = require("montage/core/core").Montage;

/**
 * @class AnalyticsService
 * @extends Montage
 */
exports.AnalyticsService = Montage.specialize(/** @lends AnalyticsService.prototype */{
    hasTemplate: {
        value: false
    },

    _vendor: {
        value: null
    },

    vendor: {
        get: function () {
            return this._vendor;
        },
        set: function (vendor) {
            if (this._vendor !== vendor) {
                this._vendor = vendor;
                this.initVendor();
            }
        }
    },

    isEnabled: {
        value: true
    },

    isDebug: {
        value: false
    },

    trackView: {
        value: function (options) {
            switch (this._vendor) {
                case "google-analytics":
                    window.ga("send", "screenview", options);
                    break;

                default:
                    console.error(new Error(this._vendor + " is not a supported vendor."));
            }
        }
    },

    trackEvent: {
        value: function (options) {
            switch (this._vendor) {
                case "google-analytics":
                    window.ga("send", "event", options);
                    break;

                default:
                    console.error(new Error(this._vendor + " is not a supported vendor."));
            }
        }
    },

    trackingId: {
        value: null
    },

    _userId: {
        value: null
    },

    userId: {
        get: function () {
            return this._userId;
        },
        set: function (userId) {
            if (this._userId !== userId) {
                this._userId = userId;
                this.set('userId', userId);
            }
        }
    },

    vendorSettings: {
        value: null
    },

    "set": {
        value: function (key, value) {
            switch (this._vendor) {
                case "google-analytics":
                    if (value) {
                        window.ga("set", key, value);
                    } else {
                        window.ga("set", key);
                    }
                    break;

                default:
                    console.error(new Error(this._vendor + " is not a supported vendor."));
            }
        }
    },

    initVendor: {
        value: function () {
            var scriptElement = document.createElement('script');
            scriptElement.async = 1;

            // always force https
            switch (this._vendor) {
                case "google-analytics":
                    // load vendor script
                    scriptElement.src = this.isDebug ?
                        "https://www.google-analytics.com/analytics_debug.js" :
                        "https://www.google-analytics.com/analytics.js";
                    document.scripts[0].parentNode.appendChild(scriptElement);

                    // init vendor vendorSettings
                    var trackerConfig;

                    window.ga = window.ga || function () {
                            (window.ga.q = window.ga.q || []).push(arguments)
                        };

                    window.ga.l = +new Date;

                    // create tracker object
                    if (this.isDebug) {
                        trackerConfig = {};
                        trackerConfig.cookieDomain = "none";

                        window.ga_debug = {trace: true};

                    } else {
                        trackerConfig = "auto";
                    }

                    window.ga("create", this.trackingId, trackerConfig);

                    // set global config
                    window.ga('require', 'displayfeatures');
                    this.set('forceSSL', true);
                    this.set('transport', 'beacon');
                    this.set(this.vendorSettings);

                    break;

                default:
                    console.error(new Error(this._vendor + " is not a supported vendor."));
            }
        }
    }
});
