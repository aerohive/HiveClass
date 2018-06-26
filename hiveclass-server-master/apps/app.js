process.title = 'apps';

var config = require('./config'),
    Hapi = require('hapi'),
    path = require('path'),
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

var CONTEXT_ROOT = (config.server.contextRoot || ''),
    REDIRECT_STATUSES = [301, 302, 303, 307];
    ENDPOINTS = [];

server.ext('onRequest', function(request, reply) {
    if (CONTEXT_ROOT) {
        request.path = request.path.replace(CONTEXT_ROOT, '');
    }

    return reply.continue();
});

var generateAppRoute = function (appName, auth) {
    var appEndpoint = '/' + appName + '/';
    ENDPOINTS.push(appEndpoint);
    var appRoute = {
        method: ['GET'],
        path: appEndpoint + '{path*}',
        config: {
            handler: {
                directory: {
                    path: function() {
                        return path.join(config.server.appsRoot, appName);
                    },
                    index: true
                }
            },
            cache: {
                expiresIn: config.cache.ttl
            },
            state: {
                failAction: 'ignore'
            }
        }
    };
    if (auth) {
        appRoute.config.auth = auth;
    }
    return appRoute;
};
server.register([
        require('hapi-auth-cookie'),
        require('blipp'),
        require('inert'),
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
        server.auth.strategy('session', 'cookie', {
            cookie: 'hiveschool_id',
            password: config.cookie.password,
            isSecure: config.cookie.is_secure,
            clearInvalid: true,
            appendNext: true,
            redirectTo: CONTEXT_ROOT + '/login/'
        });

        server.route(generateAppRoute('login'));
        server.route(generateAppRoute('teacher', 'session'));
        server.route(generateAppRoute('student', 'session'));
    });

server.ext('onPreResponse', function(request, reply) {
    if (REDIRECT_STATUSES.indexOf(request.response.statusCode) != -1 && ENDPOINTS.indexOf(request.response.headers.location) != -1) {
        request.response.headers.location = CONTEXT_ROOT + request.response.headers.location;
    }
    return reply.continue();
});

server.start(function() {
    console.log('Server listening on ' + serverConfig.host + ':' + serverConfig.port);
    console.log('Serving apps from:', config.server.appsRoot);
});
