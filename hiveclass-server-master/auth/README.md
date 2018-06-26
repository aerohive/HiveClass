# HiveClass - auth service
Service used to authenticate users using Google OAuth2 services.

## Configuration
The configuration is done in the config.js file.
The following propeties can be configured :
 - server.host : The hostname / IP address the service will bind to.
 - server.port : The port the service will bind to.
 - providers.google.client_id : The client ID of the application declared in Google developer console.
 - providers.google.client_secret : The client secret of the application declared in the Google developer console.
 - cookie.is_secure : Can the session cookie be transfered on insecure (HTTP) transport ? **Should be set to true in production.**
 - cookie.password : A random string used to crypt the session cookie.
