#!/bin/sh
curDir=$(dirname "$0")
mkdir -p ~/.osmcache
flock -xn ~/.osmcache/flock.pid node ${curDir}/server.js --cacheDir=~/.osmcache -d
