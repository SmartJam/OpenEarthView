# Intro
This module aims to convert Open Street Map XML data to geojson for 3D scene.  
Available output data formats:  

* GeoJSON

# Library
The project includes the following tool:

* OsmToGeoJSon: convert XML OSM data to extended GeoJSON data

```
                  __________________
                 |                  |
   XML OSM   --->|  OsmSaxGeoJson   | ---> GeoJSON
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
$ wget "localhost:8081/geojsontile?xtile=154394&ytile=197054&zoom=19" -O ESB19_geojson.json
```

## Automated tests
```

```

## Unit Tests
```
$ test/unit/OsmToGeoJsonMocha.js
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
