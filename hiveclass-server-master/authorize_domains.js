#!/usr/bin/env node

var fs = require('fs'),
    https = require('https');
var csvFile = process.argv[2];

var content = fs.readFileSync(csvFile, 'utf8');
var lines = content.split('\n').slice(1).sort();

var clients = {};
for (var i = 0; i < lines.length; i++) {
    var cells = lines[i].split(',');
    var sluggishName = cells[0].toLowerCase().replace(/\W/g, '-');
    var domain = cells[1];
    var client = clients[sluggishName] || [];
    client.push(domain);
    clients[sluggishName] = client;
}

function createClient(name, callback) {
    var options = {
        hostname: process.argv[3],
        port: 443,
        path: '/auth/whitelist/' + name,
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'authorization': 'Bearer ' + process.argv[4]
        }
    };
    var req = https.request(options, function (res) {
        if (res.statusCode === 201) {
            console.log("Created client", name);
            callback(name);
        } else if (res.statusCode === 409) {
            console.log("Client already exists", name);
            callback(name);
        } else {
            console.log("Error while creating client", name, ":", res.statusCode);
        }
    });
    req.end();
}

function addDomainsToClient(name, domains) {
    var options = {
        hostname: process.argv[3],
        port: 443,
        path: '/auth/whitelist/' + name + '/domains',
        method: 'PUT',
        headers: {
            'content-type': 'application/json',
            'authorization': 'Bearer ' + process.argv[4]
        }
    };
    var req = https.request(options, function (res) {
        if (res.statusCode === 204) {
            console.log("Added domains to client", name, domains);
        } else {
            console.log("Error while adding domains to client", name, domains, ":", res.statusCode);
        }
    });
    req.write(domains);
    req.end();

}

for (var name in clients) {
    createClient(name, function(name) {
        var domains = JSON.stringify(clients[name]);
        addDomainsToClient(name, domains);
    });
}
