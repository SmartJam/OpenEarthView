#!/usr/bin/env node

var fs = require('fs');
var assert = require('assert');
var osmToGeoJson = require('../lib/OsmToGeoJson.js');

process.stdin.pipe(osmToGeoJson.convert(null, function (geoJson) {
    console.log(JSON.stringify(geoJson));
}));
