#!/bin/sh
curDir=$(dirname "$0")
homedir=$(echo ~)
mkdir -p ${homedir}/.osmcache
flock -xn ${homedir}/.osmcache/flock.pid node ${curDir}/server.js \
  --debug \
  --cacheDir=${homedir}/.cache/osmcache

