module.exports = {
    server: {
        host:       '{{ server.auth.ip }}',
        port:        {{ server.auth.port }},
        contextRoot: '/auth'
    },
    providers: {
        google: {
            client_id:      '{{ server.auth.providers.google.client_id }}',
            client_secret:  '{{ server.auth.providers.google.client_secret }}'
        }
    },
    cookie: {
        is_secure: {{ server.cookie.is_secure }},
        password: '{{ server.cookie.password }}'
    },
    forceHttps:      {{ server.auth.force_https }},
    mongodbUrl:     '{{ server.auth.mongodb_url }}',
    bearerToken:    '{{ server.auth.bearer_token }}',
    loginUrl:       '{{ frontend.login.app_url }}',
    oauthLocation:  '{{ server.auth.oauthLocation }}'
};
