process.title='logging';

var config = require('./config'),
    StorageService = require('./services/storage').StorageService,
    storageService = new StorageService(),
    Hapi = require('hapi'),
    server = new Hapi.Server();

var serverConfig = {
    host: config.server.host,
    port: config.server.port
};
server.connection(serverConfig);

server.register([
        require('blipp'),
        {
            register: require('good'),
            options: {
                opsInterval: 5000,
                reporters: [
                    {
                        reporter: require('good-console'),
                        args: [{ log: 'error', response: 'error', request: 'error' }]
                    }
                ]
            }
        }
    ],
    function() {
        server.route([
            {
                method: 'POST',
                path:   '/logging',
                config: {
                    handler: function(request, reply) {
                        var payload = request.payload;
                        payload['user-agent'] = request.headers['user-agent'];
                        storageService.save(payload);
                        return reply().code(204);
                    },
                    state: {
                        failAction: 'ignore'
                    }
                }
            },
            {
                method: 'GET',
                path:   '/logging',
                config: {
                    handler: function(request, reply) {
                        var entries = storageService.retrieve();
                        return reply(JSON.stringify(entries));
                    },
                    state: {
                        failAction: 'ignore'
                    }
                }
            }
        ]);
    });

server.start(function() {
    console.log('Server listening on ' + serverConfig.host + ':' + serverConfig.port);
});

