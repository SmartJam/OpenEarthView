#!/usr/bin/env node

var fs = require('fs');
var assert = require('assert');
var osmToGeoJson = require('../lib/OsmToGeoJson.js');

opt = require('node-getopt').create([
    ['l', 'lod=LEVEL_OF_DETAILS', 'set level of details']
]).bindHelp().parseSystem();

var options = {
    'loD': JSON.parse(opt.options.lod)
}

process.stdin.pipe(osmToGeoJson.convert(null, function (geoJson) {
    geoJsonToX3dJson.convert(
            geoJson,
            options,
            onConvert = function (x3dJsonScene) {
                console.log(JSON.stringify(x3dJsonScene));
            });
}));
