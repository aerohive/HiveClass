#!/bin/sh
VERSION=$1

ansible-playbook -i environments/qa/inventory -e "branch=${VERSION}" front.yml
ansible-playbook -i environments/qa/inventory -e "branch=${VERSION}" back.yml
ansible-playbook -b -i environments/qa/inventory -e "branch=${VERSION}" build_extension.yml

