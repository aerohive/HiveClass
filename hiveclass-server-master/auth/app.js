process.title = 'auth';
var PROFILE_COOKIE =    'hiveschool_id',
    TOKENS_COOKIE =     'hiveschool_tokens',
    AUTH_COOKIE = 'hiveschool_auth';

var config = require('./config'),
    Hapi = require('hapi'),
    httpRequest = require('request'),
    server = new Hapi.Server({
        debug: {
            log: ['error'],
            request: ['error']
        }
    }),
    WhitelistService = require('./lib/whitelist').WhitelistService,
    Promise = require('bluebird');

var serverConfig = {
    host: config.server.host,
    port: config.server.port
};
server.connection(serverConfig);

var CONTEXT_ROOT = (config.server.contextRoot || '');

server.state(PROFILE_COOKIE, {
    isSecure: config.cookie.is_secure,
    isHttpOnly: true,
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

server.ext('onRequest', function(request, reply) {
    if (request.headers['x-public-host']) {
        request.info.host = request.headers['x-public-host'];
    }

    reply.continue();
});

server.register([
        require('bell'),
        require('hapi-auth-cookie'),
        require('hapi-auth-bearer-token'),
        require('inert'),
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
        var whitelistService = new WhitelistService(config.mongodbUrl);

        server.auth.strategy('google', 'bell', {
            cookie: AUTH_COOKIE,
            provider: 'google',
            clientId: config.providers.google.client_id,
            clientSecret: config.providers.google.client_secret,
            password: 'google' + config.cookie.password,
            isSecure: config.cookie.is_secure,
            forceHttps: config.forceHttps,
            location: config.oauthLocation,
            scope: [
                'openid',
                'email',
                'profile',
                'https://www.googleapis.com/auth/drive.appfolder'
            ],
            providerParams: {
                access_type: 'offline'
            }
        });

        server.auth.strategy('session', 'cookie', {
            password: 'session' + config.cookie.password,
            isSecure: config.cookie.is_secure,
            isHttpOnly: false
        });

        server.auth.strategy('bearer', 'bearer-access-token', {
            allowQueryToken: false,
            validateFunc: function (token, callback) {
                return callback(null, token === config.bearerToken, { token: token });
            }
        });

        server.route({
            method: ['GET', 'POST'],
            path: CONTEXT_ROOT + '/google',
            config: {
                auth: {
                    strategies: [ 'session', 'google' ],
                    mode: 'try'
                },
                handler: function(request, reply) {
                    if (request.auth.isAuthenticated) {
                        request.auth.session.clear();
                        var authorizationPromise = whitelistService.isDomainAuthorized(extractDomain((request.auth.credentials.profile)))
                            .then(function(isAuthorized) {
                                var credentials = request.auth.credentials,
                                    response = request.generateResponse();
                                if (isAuthorized) {
                                    var nextLocation = credentials.query.next || request.query.next;
                                    response = response.redirect(nextLocation);

                                    var profile = {
                                        id: credentials.profile.id,
                                        email: credentials.profile.email,
                                        gender: credentials.profile.raw.gender,
                                        firstname: credentials.profile.name.first,
                                        lastname: credentials.profile.name.last,
                                        avatar: credentials.profile.raw.picture
                                    };
                                    response.state(PROFILE_COOKIE, profile);

                                    var tokens = {
                                        access: credentials.token,
                                        refresh: credentials.refreshToken,
                                        expires: Date.now() + (credentials.expiresIn * 1000)
                                    };
                                    response.state(TOKENS_COOKIE,  tokens);
                                } else {
                                    httpRequest('https://accounts.google.com/o/oauth2/revoke?token=' + credentials.token);
                                    console.log('Unauthorized domain:', credentials.profile.raw.hd, 'for user', credentials.profile.email);
                                    response = response.redirect(config.loginUrl + '?cause=forbidden-hd').unstate(AUTH_COOKIE);
                                }
                                return response;
                            });
                        return reply(authorizationPromise)
                    } else {
                        console.log(request);
                        return reply.redirect(config.loginUrl + '?cause=unauthorized');
                    }
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });

        server.route({
            method: 'GET',
            path: CONTEXT_ROOT + '/check',
            config: {
                handler: function(request, reply) {
                    var tokenCookie = request.state[TOKENS_COOKIE];
                    var statusCode = (tokenCookie && tokenCookie.refresh && tokenCookie.refresh.length > 0) ? 204 : 402;
                    return reply().code(statusCode);
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });

        server.route({
            method: 'GET',
            path: CONTEXT_ROOT + '/invalidate',
            config: {
                handler: function(request, reply) {
                    var tokenCookie = request.state[TOKENS_COOKIE];
                    if (tokenCookie && tokenCookie.access) {
                        httpRequest('https://accounts.google.com/o/oauth2/revoke?token=' + tokenCookie.access);
                    }
                    reply().code(204).unstate(PROFILE_COOKIE).unstate(TOKENS_COOKIE).unstate(AUTH_COOKIE);
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });

        server.route({
            method: 'GET',
            path: CONTEXT_ROOT + '/me',
            config: {
                handler: function(request, reply) {
                    return reply(request.state[PROFILE_COOKIE]).type('application/json');
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });

        server.route({
            method: 'POST',
            path: CONTEXT_ROOT + '/whitelist/{clientName}',
            config: {
                auth: 'bearer',
                handler: function(request, reply) {
                    var clientName = request.params.clientName;
                    var result = whitelistService.createClient(clientName)
                        .then(function(code) {
                            return request.generateResponse().code(code);
                        })
                        .then(function(response) {
                            if (response.statusCode < 400 && request.payload) {
                                return whitelistService.addDomainsToClient(clientName, request.payload)
                                    .then(function() {
                                        return response;
                                    });
                            } else {
                                return response;
                            }
                        });
                    return reply(result);
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });

        server.route({
            method: 'PUT',
            path: CONTEXT_ROOT + '/whitelist/{clientName}/domains',
            config: {
                auth: 'bearer',
                handler: function(request, reply) {
                    var clientName = request.params.clientName;
                    var result = whitelistService.addDomainsToClient(clientName, request.payload)
                        .then(function(code) {
                            return request.generateResponse().code(code);
                        });
                    return reply(result);
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });

        server.route({
            method: 'PUT',
            path: CONTEXT_ROOT + '/whitelist/{clientName}/active',
            config: {
                auth: 'bearer',
                handler: function(request, reply) {
                    var clientName = request.params.clientName;
                    var result = whitelistService.setClientActiveStatus(clientName, request.payload)
                        .then(function(code) {
                            return request.generateResponse().code(code);
                        });
                    return reply(result);
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });

        server.route({
            method: 'GET',
            path: CONTEXT_ROOT + '/whitelist',
            config: {
                auth: 'bearer',
                handler: function(request, reply) {
                    return reply(whitelistService.getClients());
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });

        server.route({
            method: 'GET',
            path: CONTEXT_ROOT + '/whitelist/{clientName}',
            config: {
                auth: 'bearer',
                handler: function(request, reply) {
                    return reply(whitelistService.getClient(request.params.clientName));
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });
    });

function extractDomain(profile) {
    if (profile) {
        return profile.raw.hd || profile.email.split('@').reverse()[0];
    }
}

server.start(function() {
    console.log('Server listening on ' + serverConfig.host + ':' + serverConfig.port);
});
