#!/usr/bin/env node

var fs = require('fs');
var assert = require('assert');
var osmToGeoJson = require('../lib/OsmToGeoJson.js');

var onConvert = function (geoJson) {
    console.log(JSON.stringify(geoJson));
}

process.stdin.pipe(osmToGeoJson.convert(null, onConvert));

