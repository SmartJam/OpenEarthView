#!/bin/sh
curDir=$(dirname "$0")
homedir=$(echo ~)
mkdir -p ${homedir}/.geojsoncache
flock -xn ${homedir}/.geojsoncache/flock.pid node ${curDir}/server.js \
  --vv
