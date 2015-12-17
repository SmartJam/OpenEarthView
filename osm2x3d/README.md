osm2x3d

# Intro
This module aims to convert Open Street Map XML data to 3D scene.  
First output data formats:  

* X3D
* GeoJSON

The main script is this one:

* osm2x3dTester.sh

# Installation
`$ npm install`

# Test
`$ osm2x3dTester.sh`

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

# Unit Tests

* OsmToGeoJsonTester.js
* GeoJsonToX3dJsonTester.js
