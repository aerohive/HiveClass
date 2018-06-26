#!/usr/bin/env bash
BRANCH=${1:-master}

export ANSIBLE_HOST_KEY_CHECKING=False

vagrant destroy -f && \
vagrant up && \
ansible-playbook -i environments/local/inventory bootstrap.yml && \
git bundle create hivesclass-server.bundle ${BRANCH} && \
scp -i .vagrant/machines/default/virtualbox/private_key -o StrictHostKeyChecking=no -P 12222 hivesclass-server.bundle vagrant@127.0.0.1:/tmp/hiveclass-server.bundle && \
ssh -i .vagrant/machines/default/virtualbox/private_key -o StrictHostKeyChecking=no -p 12222 vagrant@127.0.0.1 sudo git clone --bare /tmp/hiveclass-server.bundle /tmp/hiveclass-server.git && \
rm hivesclass-server.bundle && \
cd ../../hiveclass && \
git bundle create hivesclass.bundle ${BRANCH} && \
scp -i ../hiveclass-server/deploy/.vagrant/machines/default/virtualbox/private_key -o StrictHostKeyChecking=no -P 12222 hivesclass.bundle vagrant@127.0.0.1:/tmp/hiveclass.bundle && \
ssh -i ../hiveclass-server/deploy/.vagrant/machines/default/virtualbox/private_key -o StrictHostKeyChecking=no -p 12222 vagrant@127.0.0.1 sudo git clone --bare /tmp/hiveclass.bundle /tmp/hiveclass.git && \
rm hivesclass.bundle && \
cd ../hiveclass-server/deploy && \
ansible-playbook -v -i environments/local/inventory front.yml -e "branch=${BRANCH} git_url=/tmp/hiveclass.git"
ansible-playbook -v -i environments/local/inventory back.yml -e "branch=${BRANCH} git_url=/tmp/hiveclass-server.git"
