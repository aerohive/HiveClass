/**
 * @module ui/main.reel
 */

var Component = require("montage/ui/component").Component;
    defaultLocalizer = require("montage/core/localizer").defaultLocalizer,
    Application = require("montage/core/application").application,
    ProfileService = require("common/core/profile-service").ProfileService,
    TeacherService = require("core/teacher-service").TeacherService,
    StudentService = require('core/student-service').StudentService,
    ClassroomService = require('core/classroom-service').ClassroomService,
    RendezvousService = require('core/rendezvous-service').RendezvousService,
    ResourceService = require('core/resource-service').ResourceService,
    ReportingService = require('core/reporting-service').ReportingService,
    ExtensionService = require("common/core/extension-service").ExtensionService,
    ViewScreenService = require("core/view-screen-service").ViewScreenService,
    ExtensionMessageHandler = require("core/extension-message-handler").ExtensionMessageHandler,
    FocusMode = require("core/modes/focus-mode").FocusMode,
    FollowmeMode = require("core/modes/followme-mode").FollowmeMode,
    LockMode = require("core/modes/lock-mode").LockMode,
    PresenterMode = require("core/modes/presenter-mode").PresenterMode,
    AnalyticsService = require("common/core/analytics-service").AnalyticsService,
    WsPresenceClient = require("montage-webrtc/wsPresenceClient").WsPresenceClient,
    RTCService = require("montage-webrtc/client").RTCService,
    TopologyService = require("montage-webrtc/server-topology-service").ServerTopologyService,
    configuration = require('core/configuration.json');


/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main# */ {
    constructor: {
        value: function Main() {
            this.super();
        }
    },

    enterDocument: {
        value: function enterDocument(firstTime) {
            Application.dashboardMenus = configuration.dashboardMenus;
            Application.states = configuration.states;
            Application.state = Application.states.loading;

            var extensionService = new ExtensionService(configuration);
            var rendezvousService = new RendezvousService(configuration);
            var wsPresenceClient = new WsPresenceClient().init(configuration.presenceEndpointUrl, true);
            var topologyService = new TopologyService();

            //using firstTime because of bug in Montage that makes enterDocument hit twice
            if(firstTime){

                Application.studentService = new StudentService(extensionService, wsPresenceClient, configuration);
                Application.profileService = new ProfileService(configuration, extensionService);
                Application.service = Application.teacherService = new TeacherService(Application.profileService);
                Application.resourceService = new ResourceService(extensionService, rendezvousService);
                Application.reportingService = new ReportingService();
                Application.classroomService = new ClassroomService(
                    extensionService,
                    rendezvousService,
                    Application.studentService,
                    Application.teacherService,
                    new FocusMode(wsPresenceClient),
                    new FollowmeMode(wsPresenceClient, extensionService, topologyService),
                    new LockMode(Application.studentService),
                    new PresenterMode(wsPresenceClient, topologyService),
                    wsPresenceClient,
                    topologyService,
                    configuration
                );
                Application.viewScreenService = new ViewScreenService(Application.classroomService);

            }
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
                if (msg && msg.target === 'application') {
                    var handler = messageHandler[msg.payload.type];
                    if (typeof handler === 'function') {
                        handler.call(messageHandler, msg.payload);
                    } else {
                        extensionService.handleMessage.call(extensionService, msg.payload);
                    }
                }
            });

            Application.teacherService.getProfile()
                .then(function(profile) {
                    Application.teacher = profile;
                    Application.state = Application.states.init;
                    Application.classroomService.sync();
                });

            Application.confirmModal = this.templateObjects.confirmModal;

            this._setDefaultLanguage(navigator.languages[0]);

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
    }
});

