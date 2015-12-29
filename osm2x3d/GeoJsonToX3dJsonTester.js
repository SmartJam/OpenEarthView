var fs = require('fs');
var assert = require('assert');
var geoJsonToX3dJson = require('./GeoJsonToX3dJson.js');
var ref = require('./resources/ESB_light_x3d.json', "utf8");

var geoJsonBlock = require("./resources/ESB_light_geoJson.json");

onConvert = function (x3dJsonScene) {
    process.stdout.write("GeoJsonToX3djson assertion 1...");
    assert.deepEqual(JSON.stringify(ref), JSON.stringify(x3dJsonScene), "message");
    process.stdout.write("OK\n");
};

geoJsonToX3dJson.convert(geoJsonBlock, [-73.9862797, 40.7481926], onConvert);

