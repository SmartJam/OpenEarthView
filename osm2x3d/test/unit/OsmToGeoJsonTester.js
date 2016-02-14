var fs = require('fs');
var assert = require('assert');
var osmToGeoJson = require('../../lib/OsmToGeoJson.js');
var ref = require("../resources/ESB_light_geoJson.json");

var onConvert = function (geoJson) {
    process.stdout.write("OsmToGeoJson assertion 1...");
//    console.log(JSON.stringify(geoJson));
    // assert.deepEqual(geoJson, ref, "message");
    // process.stdout.write("OK\n");
}

var osmToGeoWS = osmToGeoJson.convert(null, onConvert);
var fileRS = fs.createReadStream('../resources/ESB_light.osm');
fileRS.pipe(osmToGeoWS);
