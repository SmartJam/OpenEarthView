#!/bin/sh

myBaseDir=$(pwd)

# unit tests #
cd unit
mocha OsmToGeoJsonMocha.js
mocha GeoJsonToX3dJsonMocha.js
# mocha X3dJsonToX3dMocha.js
# mocha GeoJsonToGeoX3dJsonMocha.js
# mocha GeoJsonToThreejsGeoFormat4.js

# integration tests #

# production tests #
