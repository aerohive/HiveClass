/**
 * @module ui/main.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    defaultLocalizer = require("montage/core/localizer").defaultLocalizer,
    Application = require("montage/core/application").application,
    ClassroomService = require('core/classroom-service').ClassroomService,
    ProfileService = require("common/core/profile-service").ProfileService,
    RendezvousService = require('core/rendezvous-service').RendezvousService,
    ExtensionService = require("common/core/extension-service").ExtensionService,
    ClassroomJoinerService = require("core/classroom-joiner-service").ClassroomJoinerService,
    StudentService = require("core/student-service").StudentService,
    ExtensionMessageHandler = require("core/extension-message-handler").ExtensionMessageHandler,
    AnalyticsService = require("common/core/analytics-service").AnalyticsService,
    WsPresenceClient = require("montage-webrtc/wsPresenceClient").WsPresenceClient,
    RtcPresenceClient = require("montage-webrtc/rtcPresenceClient").RtcPPresenceClient,
    RTCService = require("montage-webrtc/client").RTCService,
    configuration = require('core/configuration.json');

/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main# */ {

    enterDocument: {
        value: function enterDocument(firstTime) {
            if (firstTime) {
                Application.states = configuration.states;
                Application.state = Application.states.loading;

                var extensionService = new ExtensionService(configuration);
                var rtcService = new RTCService();
                var rtcPresenceClient = new RtcPresenceClient();
                Application.classroomService = new ClassroomService(
                    extensionService,
                    new RendezvousService(configuration),
                    Application,
                    new WsPresenceClient().init(configuration.presenceEndpointUrl, false),
                    rtcService,
                    rtcPresenceClient,
                    configuration.loggingEndpoint);
                Application.studentService = new StudentService(new ProfileService(configuration, extensionService));
                Application.classroomJoinerService = new ClassroomJoinerService(Application.classroomService, Application.studentService);
                Application.classroomJoinerService.application = Application;

                // analytics

                Application.analyticsService = new AnalyticsService();
                Application.analyticsService.trackingId = "UA-72188188-2";
                Application.analyticsService.isEnabled = true;
                Application.analyticsService.isDebug = Application.isDebug || false;
                // submit app name & version # from package.json
                Application.analyticsService.vendorSettings = {
                    'appName': require.packageDescription.name,
                    'appVersion': require.packageDescription.version,
                    'dataSource': 'app'
                };
                // vendor property setter inits vendor service
                Application.analyticsService.vendor = "google-analytics";

                var messageHandler = new ExtensionMessageHandler(Application.classroomService);
                window.addEventListener("message", function (event) {
                    var msg = event.data;
                    if (msg && msg.target === 'application' && msg.payload) {
                        var handler = messageHandler[msg.payload.type];
                        if (typeof handler === 'function') {
                            handler.call(messageHandler, msg.payload);
                        } else {
                            extensionService.handleMessage.call(extensionService, msg.payload);
                        }
                    }
                });



                var application = this.application,
                    self = this;

                application.showCloseTabs = false;
                application.connectionRefused = false;

                application.studentService.getProfile()
                    .then(function (profile) {
                        application.student = profile;

                        return self.application.classroomService.listOpenClassrooms()
                            .then(function (openClassrooms) {
                                if (openClassrooms && openClassrooms.length) {
                                    application.state = application.states.enterClass; //classes -> routes to the list of classes
                                } else {
                                    application.state = application.states.joinClass; //no classes -> routes to the join class
                                }
                            });
                    });

                this._setDefaultLanguage(navigator.languages[0]);
            }
        }
    },

    _setDefaultLanguage: {
        value: function (language) {
            //language auto-detect
            
            switch (language) {
                default:
                    if (language == "en"){
                        defaultLocalizer.locale = "en";
                        this.application.defaultLanguage = "English";
                    } else {
                        var lang = language.slice(0, 2);
                        this._setDefaultLanguage(lang);
                    }
                    break;
                case "de":
                    defaultLocalizer.locale = "de";
                    this.application.defaultLanguage = "Deutsch";
                    break;
                case "es":
                    defaultLocalizer.locale = "es";
                    this.application.defaultLanguage = "Español";
                    break;
                case "fi":
                    defaultLocalizer.locale = "fi";
                    this.application.defaultLanguage = "Suomi";
                    break;
                case "fr":
                    defaultLocalizer.locale = "fr";
                    this.application.defaultLanguage = "Français";
                    break;
                case "it":
                    defaultLocalizer.locale = "it";
                    this.application.defaultLanguage = "Italiano";
                    break;
                case "ja":
                    defaultLocalizer.locale = "ja";
                    this.application.defaultLanguage = "日本語";
                    break;
                case "ko":
                    defaultLocalizer.locale ="ko";
                    this.application.defaultLanguage = "한국인";
                    break;
                case "nl":
                    defaultLocalizer.locale = "nl";
                    this.application.defaultLanguage = "Dutch";
                    break;
                case "pt":
                    defaultLocalizer.locale = "pt";
                    this.application.defaultLanguage = "Português";
                    break;
                case "sv":
                    defaultLocalizer.locale = "sv";
                    this.application.defaultLanguage = "Svenska";
                    break;
                case "zh-Hans":
                    defaultLocalizer.locale = "zh-Hans";
                    this.application.defaultLanguage = "简体中文";
                    break;
                case "zh-Hant":
                    defaultLocalizer.locale = "zh-Hant";
                    this.application.defaultLanguage = "繁體中文";
                    break;
            }
        }
    },

    handleLogStateAction: {
        value: function() {
            this.application.classroomService.logState(this.application.student);
        }
    }

});
