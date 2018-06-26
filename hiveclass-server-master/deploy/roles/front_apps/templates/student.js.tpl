var Montage = require("montage").Montage;


exports.Configuration = Montage.specialize({

    constructor: {
        value: function Configuration () {
            this.states = {
                loading: 'loading',
                enterClass: 'enterClass',
                joinClass: 'joinClass',
                photoBooth: 'photoBooth',
                followMe: 'followMe',
                attention: 'attention',
                closeTabs: 'closeTabs',
                dashboard: 'dashboard',
                connectionError: 'connectionError',
                connectionClosed: 'connectionClosed'
            };

            this.extensionId = window.document.getElementsByTagName('body')[0].getAttribute('extensionId');
            this.profileEndpoint = '{{ frontend.student.profile_endpoint }}';
            this.rendezvousEndpoint = '{{ frontend.common.rendez_vous_endpoint }}';
            this.loggingEndpoint = '{{ frontend.common.logging_endpoint }}';
        }
    },


    states: {
        value: null
    },

    snapShotSize: {
        value: {
            width: 205,
            height: 232
        }
    }

});
