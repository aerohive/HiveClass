module.exports = {
    server: {
        host: '0.0.0.0',
        port: 8085,
        contextRoot: '/storage'
    },
    providers: {
        google: {
            client_id: '532334985580-7ijn35j37uirs9f9u5eij7k8q59emsn0.apps.googleusercontent.com',
            client_secret: 'TNKnH3tWK6KSzjrRIDeG_ASV'
        }
    },
    authenticationEndpoint: '/auth/google',
    cookie: {
        is_secure: false,
        password: '63581e0fca66ca827d10e6bc2f3c538392f09718'
    },
    mongodbUrl: 'mongodb://localhost:27017/storage',
};
