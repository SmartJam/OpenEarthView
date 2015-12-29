
var fs = require('fs');
var assert = require('assert');
var osmToGeoJson = require('./OsmToGeoJson.js');
var ref = require("./resources/ESB_light_geoJson.json");

//onConvert1 = function (geoJson) {
//    process.stdout.write("OsmToGeoJson assertion 1...");
//    assert.deepEqual(geoJson, ref, "message");
//    process.stdout.write("OK\n");
//}

onConvert2 = function (geoJson) {
    process.stdout.write("OsmToGeoJson assertion 2...");
//    console.log(JSON.stringify(geoJson));
    assert.deepEqual(geoJson, ref, "message");
    process.stdout.write("OK\n");
}

//osmToGeoJson.convert(onConvert1);


var ws = osmToGeoJson.convert(onConvert2);
var fileReadStream = fs.createReadStream('resources/ESB_light.osm');
fileReadStream.pipe(ws);
