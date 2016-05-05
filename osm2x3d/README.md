# Intro
This module aims to convert Open Street Map XML data to 3D scene.  
Available output data formats:  

* GeoJSON
* X3D

# Library
The project is divided into several tools:

* OsmToGeoJSon: convert XML OSM data to extended GeoJSON data
* GeoJsonToJsonX3d: convert extended GeoJSON data to JSON X3D data

```
                  __________________
                 |                  |
   XML OSM   --->| JsonOsmToGeoJSon | ---> GeoJSON
                 |__________________|
                  __________________
                 |                  |
   GeoJSON   --->| GeoJsonToJsonX3d | ---> JSON X3D
                 |__________________|
```

# Installation
```
$ npm install
```

# Web server
To start the web server:
```
$ web_server.sh
```

# Test

## Requests:
```
$ wget "localhost:8081/3dtile?format=x3djson&xtile=77196&ytile=98527&zoom=18" -O x3djson.json
$ wget "localhost:8081/3dtile?format=geojson&xtile=154394&ytile=197054&zoom=19" -O ESB19_geojson.json
```

## Automated tests
```
$ test/osm2x3dTester.sh
```

## Unit Tests
```
$ test/unit/OsmToGeoJsonMocha.js
$ test/unit/GeoJsonToX3dJsonMocha.js
```
