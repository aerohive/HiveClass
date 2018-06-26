module.exports = {
    server: {
        host: 'localhost',
        port: 8088
    },
    backends: {
        auth: {
            host: 'localhost',
            port: 8081,
            protocol: 'http'
        },
        google: {
            host: 'localhost',
            port: 8081,
            protocol: 'http'
        },
        apps: {
            host: 'localhost',
            port: 8082,
            protocol: 'http'
        },
        jira: {
            host: 'localhost',
            port: 8083,
            protocol: 'http'
        },
        logging: {
            host: 'localhost',
            port: 8084,
            protocol: 'http'
        },
        storage: {
            host: 'localhost',
            port: 8085,
            protocol: 'http'
        }
    }
};
