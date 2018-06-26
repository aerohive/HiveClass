module.exports = {
    server: {
        host: '{{ server.storage.ip }}',
        port: {{ server.storage.port }},
        contextRoot: '/storage'
    },
    providers: {
        google: {
            client_id: '{{ server.auth.providers.google.client_id }}',
            client_secret: '{{ server.auth.providers.google.client_secret }}'
        }
    },
    authenticationEndpoint: '/auth/google',
    cookie: {
        is_secure: {{ server.cookie.is_secure }},
        password: '{{ server.cookie.password }}'
    },
    mongodbUrl:     '{{ server.auth.mongodb_url }}'
};
