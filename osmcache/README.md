# Intro
This module aims to put Open Street Map XML data in local cache.

# Installation
```
$ npm install
```

# Web server
To start the web server:
```
$ server.sh
```

# Test

## Requests:
```
$ wget "localhost:8082/osmCache/osmXml?tile=zoom,xtile,ytile
Example:
$ wget "localhost:8082/osmCache/osmXml?tile=18,77196,98527
```

## Unit Tests
```
$ test/unit/serverMocha.js
```
