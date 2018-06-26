#!/bin/sh

ansible-playbook -b -i environments/staging/inventory front.yml
ansible-playbook -b -i environments/staging/inventory back.yml
ansible-playbook -b -i environments/staging/inventory build_extension.yml

