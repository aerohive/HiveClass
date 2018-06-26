#!/bin/sh

OS=$(uname -s |tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

rm -rf .logs && mkdir .logs

launch() {
  MODULE=$1
  echo -n Starting module ${MODULE}...
  node ./${MODULE}/app.js |awk '{ print "['${MODULE}'] "$0; fflush() }' >> .logs/${MODULE}.log &
  echo OK
}

install_mongo() {
  if [ -e mongodb/bin/mongod ] || [ -e mongodb/bin/mongod.exe ]; then
    echo "Mongodb already installed, skipping..."
  else
    mkdir -p mongodb/data
    if [ "$OS" = "linux" ]; then
      curl -o /tmp/mongodb.tar.gz https://fastdl.mongodb.org/linux/mongodb-linux-${ARCH}-3.2.0.tgz
      tar xzf /tmp/mongodb.tar.gz -C mongodb --strip-components=1
    else
      if [ "$OS" = "darwin" ]; then
        curl -o /tmp/mongodb.tar.gz https://fastdl.mongodb.org/osx/mongodb-osx-x86_64-3.2.0.tgz
        tar xzf /tmp/mongodb.tar.gz -C mongodb --strip-components 1
      else
        curl -o ${TEMP}/mongodb.zip https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-3.2.0.zip
        cd mongodb
        unzip ${TEMP}/mongodb.zip
        cp -r */* .
      fi
    fi
  fi
}

check_mongo_running() {
  if [ "$OS" = "linux" ]; then
    RUNNING_MONGO=$(netstat -tnl | awk '{ print $4 }' | grep 27017)
  else
    RUNNING_MONGO=$(netstat -natp tcp | grep -i "listen" | awk '{ print $4 }' | grep 27017)
  fi
  if [ -n "$RUNNING_MONGO" ]; then
    echo "Mongodb already running, skipping..."
  else
    install_mongo
    ./mongodb/bin/mongod --dbpath mongodb/data --logpath .logs/mongod.log --noprealloc --smallfiles &
  fi
}

check_mongo_running

launch apps
launch auth
sleep 2
curl -X POST -v 127.0.0.1:8081/auth/whitelist/dev --data-binary '["montagestudio.com", "chaussalet.net", "gmail.com"]' -H 'content-type: application/json' -H 'authorization: Bearer local_token'
launch jira
launch logging
launch storage
launch rendezvous
launch router

./node_modules/.bin/gulp browser-sync
pkill -F mongodb/mongod.pid
pkill -s 0
#tail -n100 -F -q .logs/*.log
