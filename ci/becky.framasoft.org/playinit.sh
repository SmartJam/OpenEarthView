#!/bin/sh

PYTHONUNBUFFERED=1 ANSIBLE_FORCE_COLOR=true \
ANSIBLE_HOST_KEY_CHECKING=false \
ANSIBLE_SSH_ARGS='-o UserKnownHostsFile=/dev/null -o ControlMaster=auto -o ControlPersist=60s' \
ansible-playbook \
--user=piz \
--connection=ssh \
--inventory-file=./ansible-init/inventory \
--limit='becky.framasoft.org' \
-vvvv \
--extra-vars "ansible_become_pass=$1" \
--extra-vars "ansible_ssh_pass=$1" \
./ansible-init/playbook.yml
