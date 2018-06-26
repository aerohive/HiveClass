module.exports = {
    server: {
        host: '{{ server.jira.ip }}',
        port: {{ server.jira.port }}
    },
    upstream: {
        host:           '{{ server.jira.upstream.host }}',
        protocol:       '{{ server.jira.upstream.protocol }}',
        authorization:  '{{ server.jira.upstream.authorization }}'
    }
};