var HttpClient = require('./lib/httpClient').HttpClient;

var client = new HttpClient();

client.get('http://www.google.com/')
  .then(function(response) {
    console.log(response);
  });
