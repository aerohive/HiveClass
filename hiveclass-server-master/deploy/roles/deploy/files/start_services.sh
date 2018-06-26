#!/bin/sh

pm2 start /opt/apps/app.js          --interpreter=nodejs --name apps
pm2 start /opt/auth/app.js          --interpreter=nodejs --name auth
pm2 start /opt/jira/app.js          --interpreter=nodejs --name jira
pm2 start /opt/logging/app.js       --interpreter=nodejs --name logging
pm2 start /opt/rendezvous/app.js    --interpreter=nodejs --name rendezvous
pm2 start /opt/storage/app.js       --interpreter=nodejs --name storage
pm2 start /opt/router/app.js        --interpreter=nodejs --name router
pm2 web --no-daemon