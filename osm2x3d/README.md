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

# Licence
The MIT License (MIT)
Copyright (c) 2016 Clément Igonet

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
