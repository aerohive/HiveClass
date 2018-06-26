/**
 * @module ./application-delegate
 * @requires montage/core/core
 */
var Montage = require("montage/core/core").Montage,
    Configuration = require("core/configuration").Configuration,
    ClassroomService = require('core/classroom-service').ClassroomService,
    ProfileService = require("common/core/profile-service").ProfileService,
    RendezvousService = require('core/rendezvous-service').RendezvousService,
    ExtensionService = require("common/core/extension-service").ExtensionService,
    ClassroomJoinerService = require("core/classroom-joiner-service").ClassroomJoinerService,
    StudentService = require("core/student-service").StudentService,
    ExtensionMessageHandler = require("core/extension-message-handler").ExtensionMessageHandler,
    AnalyticsService = require("common/core/analytics-service").AnalyticsService;


/**
 * @class ApplicationDelegate
 * @extends Montage
 */
exports.ApplicationDelegate = Montage.specialize(/** @lends ApplicationDelegate# */ {

    willFinishLoading: {
        value: function (app) {
            app.classroom = null;
            app.student = null;

            var configuration = new Configuration();
            app.states = configuration.states;
            app.state = app.states.loading;

            var extensionService = new ExtensionService(configuration);
            app.classroomService = new ClassroomService(extensionService, new RendezvousService(configuration), app, configuration.loggingEndpoint);
            app.studentService = new StudentService(new ProfileService(configuration, extensionService));
            app.classroomJoinerService = new ClassroomJoinerService(app.classroomService, app.studentService);
            app.classroomJoinerService.application = app;

            // analytics

            app.analyticsService = new AnalyticsService();
            app.analyticsService.trackingId = "UA-72188188-2";
            app.analyticsService.isEnabled = true;
            app.analyticsService.isDebug = app.isDebug || false;
            // submit app name & version # from package.json
            app.analyticsService.vendorSettings = {
                'appName': require.packageDescription.name,
                'appVersion': require.packageDescription.version,
                'dataSource': 'app'
            };
            // vendor property setter inits vendor service
            app.analyticsService.vendor = "google-analytics";

            var messageHandler = new ExtensionMessageHandler(app.classroomService);
            app.window.window.addEventListener("message", function (event) {
                var msg = event.data;
                if (msg && msg.target === 'application' && msg.payload) {
                    var handler = messageHandler[msg.payload.type];
                    if (typeof handler === 'function') {
                        handler.call(messageHandler, msg.payload);
                    } else {
                        extensionService.handleMessage.call(extensionService, msg.payload);
                    }
                }
            })
        }
    }

});
