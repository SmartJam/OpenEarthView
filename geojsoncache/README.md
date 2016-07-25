# Intro
This module aims to put Open Earth View geojson data in local cache.

# Installation
```
$ npm install
```

# Web server
To start the web server:
```
$ geojsoncache.sh
```

# Test

## Requests:
```
$ wget "localhost:8083/oevcache/geojson?tile=zoom,xtile,ytile
Example:
$ wget "localhost:8083/oevcache/geojson?tile=18,77196,98527
```

## Unit Tests
```
$ test/unit/serverMocha.js
```
