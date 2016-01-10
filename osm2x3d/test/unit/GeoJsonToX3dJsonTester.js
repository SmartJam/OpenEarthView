var fs = require('fs');
var assert = require('assert');
var geoJsonToX3dJson = require('../../lib/GeoJsonToX3dJson.js');
var ref = require('../resources/ESB_light_x3d.json', "utf8");

var geoJsonBlock = require("../resources/ESB_light_geoJson.json");

onConvert = function (x3dJsonScene) {
    process.stdout.write("GeoJsonToX3djson assertion 1...");
//    console.log(JSON.stringify(x3dJsonScene));
    assert.deepEqual(JSON.stringify(ref), JSON.stringify(x3dJsonScene), "message");
    process.stdout.write("OK\n");
};

var options = {
    'origin': [-73.9862797, 40.7481926],
    'loD': 4
}
geoJsonToX3dJson.convert(geoJsonBlock, options, onConvert);

