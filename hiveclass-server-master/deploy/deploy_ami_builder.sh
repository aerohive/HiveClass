#!/bin/sh
ENV=$1
IP=$2
VERSION=$3


sed -i "1s/[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*/${IP}/" environments/${ENV}/inventory && \
ansible-playbook -i environments/${ENV}/inventory bootstrap.yml && \
ansible -i environments/${ENV}/inventory webservers -m shell -a 'reboot' && \
sleep 90 && \
ansible-playbook -i environments/${ENV}/inventory bootstrap.yml && \
ansible-playbook -i environments/${ENV}/inventory -e "branch=${VERSION}" front.yml
ansible-playbook -i environments/${ENV}/inventory -e "branch=${VERSION}" back.yml && \
sleep 15 && \
ansible-playbook -i environments/${ENV}/inventory whitelist.yml

