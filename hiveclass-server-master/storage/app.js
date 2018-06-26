process.title = 'storage';
var PROFILE_COOKIE = 'hiveschool_id',
    TOKENS_COOKIE  = 'hiveschool_tokens';

var config = require('./config'),
    DbStorageService = require('./lib/dbStorage').DbStorageService,
    Hapi = require('hapi'),
    server = new Hapi.Server({
        debug: {
            log: ['error'],
            request: ['error']
        }
    });

var serverConfig = {
    host: config.server.host,
    port: config.server.port
};
server.connection(serverConfig);

var CONTEXT_ROOT = (config.server.contextRoot || '');
server.ext('onRequest', function(request, reply) {
    if (CONTEXT_ROOT) {
        request.path = request.path.replace(CONTEXT_ROOT, '');
    }

    return reply.continue();
});

server.state(PROFILE_COOKIE, {
    isSecure: config.cookie.is_secure,
    isHttpOnly: false,
    path: '/',
    encoding: 'iron',
    password: config.cookie.password
});

server.state(TOKENS_COOKIE, {
    isSecure: config.cookie.is_secure,
    isHttpOnly: false,
    path: '/',
    encoding: 'iron',
    password: config.cookie.password
});

var dbStorageService = new DbStorageService(config.mongodbUrl);

server.register([
        require('blipp'),
        require('hapi-auth-cookie'),
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
            method: 'GET',
            path: '/{filename}',
            config: {
                handler: function(request, reply) {
                    if (request.state[PROFILE_COOKIE]) {
                        var userId = request.state[PROFILE_COOKIE].id,
                            filename = request.params.filename;
                        var replyPromise = dbStorageService.getJsonFile(userId, filename)
                            .then(function(file) {
                                var response = request.generateResponse(file);
                                response.code(file ? 200 : 404);
                                return response;
                            });
                        reply(replyPromise);
                    } else {
                        reply().code(204);
                    }
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });

        server.route({
            method: 'POST',
            path: '/{filename}',
            config: {
                handler: function(request, reply) {
                    var userId = request.state[PROFILE_COOKIE].id,
                        filename = request.params.filename,
                        data = request.payload;
                    var replyPromise = dbStorageService.saveJsonFile(userId, filename, data);
                    reply(replyPromise);
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });
    });

server.start(function() {
    console.log('Server listening on ' + serverConfig.host + ':' + serverConfig.port);
});
