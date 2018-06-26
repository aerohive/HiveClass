module.exports = {
    server: {
        host: '{{ server.router.ip }}',
        port: {{ server.router.port }}
    },
    backends: {
        auth: {
            host: '{{ server.router.auth.ip }}',
            port: {{ server.router.auth.port }},
            protocol: '{{ server.router.auth.protocol }}'
        },
        google: {
            host: '{{ server.router.google.ip }}',
            port: {{ server.router.google.port }},
            protocol: '{{ server.router.google.protocol }}'
        },
        apps: {
            host: '{{ server.router.apps.ip }}',
            port: {{ server.router.apps.port }},
            protocol: '{{ server.router.apps.protocol }}'
        },
        jira: {
            host: '{{ server.router.jira.ip }}',
            port: {{ server.router.jira.port }},
            protocol: '{{ server.router.jira.protocol }}'
        },
        logging: {
            host: '{{ server.router.logging.ip }}',
            port: {{ server.router.logging.port }},
            protocol: '{{ server.router.logging.protocol }}'
        },
        storage: {
            host: '{{ server.router.storage.ip }}',
            port: {{ server.router.storage.port }},
            protocol: '{{ server.router.storage.protocol }}'
        }
    }
};
