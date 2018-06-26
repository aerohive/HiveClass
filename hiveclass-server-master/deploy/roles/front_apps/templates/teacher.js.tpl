var Montage = require("montage/core/core").Montage;


exports.Configuration = Montage.specialize({

    constructor: {
        value: function Configuration () {
            this.super();

            this.states = {
                loading:            'loading',
                init:               'init',
                screens:            'screens',
                dashboard:          'dashboard',
                resources:          'resources',
                feedback:           'feedback',
                connectionClosed:   'connectionClosed'
            };

            this.dashboardMenus = [
                "students",
                "resources"
            ];

            this.extensionId = window.document.getElementsByTagName('body')[0].getAttribute('extensionId');
            this.profileEndpoint = '{{ frontend.teacher.profile_endpoint}}';
            this.storageEndpoint = '{{ frontend.teacher.storage_endpoint}}';
            this.rendezvousEndpoint = '{{ frontend.common.rendez_vous_endpoint }}';
            this.studentUrl = '{{ frontend.student.app_url }}';
        }
    },

    profileEndpoint: {
        value: null
    },

    rendezvousHost: {
        value: null
    },

    rendezvousPort: {
        value: null
    },

    states: {
        value: null
    },

    dashboardMenus: {
        value: null
    },

    refreshTimeBeforeCaptureStudentScreen: {
        value: 800 //ms
    }

});
