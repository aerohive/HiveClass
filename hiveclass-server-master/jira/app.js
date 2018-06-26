process.title='jira';

var config = require('./config'),
    Hapi = require('hapi'),
    server = new Hapi.Server();

var serverConfig = {
    host: config.server.host,
    port: config.server.port
};
server.connection(serverConfig);

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
                        args: [{ log: 'error', response: 'error', request: 'error' }]
                    }
                ]
            }
        }
    ],
    function() {
        server.route({
            method: '*',
            path:   '/jira/{path*}',
            config: {
                handler: {
                    proxy: {
                        mapUri:     function(request, callback) {
                            var upstream_path = request.url.path.replace(/^\/jira/, ''),
                                upstream_uri =  config.upstream.protocol + '://' +
                                                config.upstream.host +
                                                upstream_path,
                                headers = {
                                    authorization:  config.upstream.authorization,
                                    'content-type': request.headers['content-type']
                                };
                            console.log(headers);
                            callback(null, upstream_uri, headers);
                        }
                    }
                },
                state: {
                    failAction: 'ignore'
                }
            }
        })
    });

server.start(function() {
    console.log('Server listening on ' + serverConfig.host + ':' + serverConfig.port);
});

