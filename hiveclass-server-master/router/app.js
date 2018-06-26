process.title = 'router';

var config = require('./config'),
    Hapi = require('hapi'),
    server = new Hapi.Server();

var serverConfig = {
    host: config.server.host,
    port: config.server.port
};
server.connection(serverConfig);

var backends = config.backends;

server.ext('onRequest', function(request, reply) {
    request.headers['x-public-host'] = request.headers.host;
    reply.continue();
});

function generateRoutes(upstreams) {
    var routes = [];
    for (var prefix in upstreams) {
        var upstream = upstreams[prefix];
        routes.push({
            path: '/' + prefix + '/{param*}',
            method: '*',
            config: {
                handler: {
                    proxy: {
                        host: upstream.host,
                        port: upstream.port,
                        protocol: upstream.protocol,
                        passThrough: upstream.passTrough || true,
                        xforward: true,
                        ttl: 'upstream'
                    }
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });
    }
    return routes;
}

server.register([
        require('blipp'),
        require('h2o2'),
        {
            register: require('good'),
            options: {
                opsInterval: 5000,
                reporters: [
                    {
                        reporter: require('good-console'),
                        args: [{log: 'error', response: 'error', request: 'error'}]
                    }
                ]
            }
        }
    ],
    function() {
        server.route(generateRoutes(backends));
    });

server.start(function() {
    console.log('Server listening on ' + serverConfig.host + ':' + serverConfig.port);
});
