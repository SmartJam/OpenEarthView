var fs = require('fs');
var assert = require('assert');
var osmToGeoJson = require('./OsmToGeoJson.js');
var ref = require("./resources/ESB_light_geoJson.json");

onConvert = function (geoJson) {
    process.stdout.write("OsmToGeoJson assertion 1...");
    assert.deepEqual(geoJson, ref, "message");
    process.stdout.write("OK\n");
}

var osmToGeoOS = osmToGeoJson.convert(onConvert);
var fileIS = fs.createReadStream('./resources/ESB_light.osm');
fileIS.pipe(osmToGeoOS);
