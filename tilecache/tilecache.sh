#!/bin/sh
curDir=$(dirname "$0")
mkdir -p ~/.tilecache
flock -xn ~/.tilecache/flock.pid node ${curDir}/server.js -d --cacheDir=~/.tilecache
