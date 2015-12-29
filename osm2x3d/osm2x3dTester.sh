#!/bin/sh

cat resources/ESB_light.osm | node OsmToGeoJsonTester.js | cat
#cat resources/ESB_light.osm | node OsmToGeoJsonSyncTester.js | cat
#cat resources/ESB_light_geoJson.json | node GeoJsonToX3dJsonTester.js | cat

