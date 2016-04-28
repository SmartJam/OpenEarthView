# Intro
This module aims to put Tile data in local cache.

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
$ wget "http://localhost:8084/zoom/xtile/ytile.png"

Example:
$ wget "http://localhost:8084/18/77196/98527.png"
```

## Unit Tests
```
$ test/unit/serverMocha.js
```
