var SECONDS = 1000,
    MINUTES = 60 * SECONDS,
    HOURS = 60 * MINUTES;

module.exports = {
    server: {
        host: '{{ server.apps.ip }}',
        port: {{ server.apps.port }},
        contextRoot: '/apps',
        appsRoot: '/srv/www'
    },
    authenticationEndpoint: '/auth/google',
    cookie: {
        is_secure: {{ server.cookie.is_secure }},
        password: '{{ server.cookie.password }}'
    },
    cache: {
        ttl: {{ server.apps.cache.ttl }} * HOURS
    }
};
