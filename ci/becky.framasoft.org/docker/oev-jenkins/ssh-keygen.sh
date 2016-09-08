#!/bin/sh
if [ $# -lt 1 ]; then
  user="jenkins@gs-jenkins"
else
  user="$1"
fi
if [ ! -f /var/jenkins_home/.ssh/id_rsa ]; then
  ssh-keygen -t rsa -f /var/jenkins_home/.ssh/id_rsa -b 4096 -N "" -C "$user"
fi
