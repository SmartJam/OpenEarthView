#!/bin/sh

PYTHONUNBUFFERED=1 ANSIBLE_FORCE_COLOR=true \
ANSIBLE_HOST_KEY_CHECKING=false \
ANSIBLE_SSH_ARGS='-o UserKnownHostsFile=/dev/null -o ControlMaster=auto -o ControlPersist=60s' \
ansible-playbook \
--private-key=~/.ssh/id_rsa_becky \
--user=oev \
--connection=ssh \
--inventory-file=./inventory \
--limit='becky.framasoft.org' \
-vvvv \
--extra-vars "ansible_sudo_pass=$2" \
./$1
