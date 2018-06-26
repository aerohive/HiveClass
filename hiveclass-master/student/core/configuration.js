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
            this.profileEndpoint = 'http://localhost:8080/auth/me';
            this.rendezvousEndpoint = 'ws://localhost:9090/ws';
            this.loggingEndpoint = 'http://localhost:8080/logging'
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
