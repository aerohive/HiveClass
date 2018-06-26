module.exports = {
    server: {
        host: '0.0.0.0',
        port: 8081,
        contextRoot: '/auth'
    },
    providers: {
        google: {
            client_id: '532334985580-7ijn35j37uirs9f9u5eij7k8q59emsn0.apps.googleusercontent.com',
            client_secret: 'TNKnH3tWK6KSzjrRIDeG_ASV'
        }
    },
    cookie: {
        is_secure: false,
        password: '63581e0fca66ca827d10e6bc2f3c538392f09718'
    },
    forceHttps: false,
    mongodbUrl: 'mongodb://localhost:27017/auth',
    bearerToken: 'local_token',
    loginUrl: 'http://localhost:8080/apps/login/',
    oauthLocation: 'http://localhost:8080'
};
