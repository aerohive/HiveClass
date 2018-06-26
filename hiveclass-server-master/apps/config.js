var SECONDS = 1000,
    MINUTES = 60 * SECONDS,
    HOURS = 60 * MINUTES;

module.exports = {
    server: {
        host: '0.0.0.0',
        port: 8082,
        contextRoot: '/apps',
        appsRoot: __dirname
    },
    authenticationEndpoint: '/auth/google',
    cookie: {
        is_secure: false,
        password: '63581e0fca66ca827d10e6bc2f3c538392f09718'
    },
    cache: {
        ttl: 0
    }
};
