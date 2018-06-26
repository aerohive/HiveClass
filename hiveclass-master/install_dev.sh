#!/bin/sh
git clone git@github.com:montagestudio/hiveclass.git
cd hiveclass

if [ "_$1" != "_" ]; then
  git fetch origin pull/$1/head:PR_$1
  git checkout PR_$1
fi

cd login
npm install
cd -

cd student
npm install
cd -

cd teacher
npm install
cd -

cd ..

git clone git@github.com:montagestudio/hiveclass-server.git
cd hiveclass-server
npm install

cd apps
npm install
cd -

cd auth
npm install
cd -

cd rendezvous
npm install
cd -

cd jira
npm install
cd -

cd logging
npm install
cd -

cd storage
npm install
cd -

cd router
npm install
cd -

cd apps
ln -s ../../hiveclass/login
ln -s ../../hiveclass/student
ln -s ../../hiveclass/teacher
cd -

./start.sh

