#!/bin/sh
while read p; do echo $p >> /etc/hosts ; done </tmp/hosts

