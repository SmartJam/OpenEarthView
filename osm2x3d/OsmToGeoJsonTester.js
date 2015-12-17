
var fs = require('fs');
var assert = require('assert');
var osmToGeoJson = require('./OsmToGeoJson.js');
var geoJsonOS = fs.createWriteStream('target/ESB_light_geoJson.json');

var ref = require("./resources/ESB_light_geoJson.json");

var onBlock;
onBlock = function (geoJsonBlockData) {
    process.stdout.write("OsmToGeoJson assertion 1...");
    assert.equal(JSON.stringify(ref), JSON.stringify(geoJsonBlockData), "message");
    process.stdout.write("OK\n");
//    console.log("geoJsonBlockData: " + JSON.stringify(geoJsonBlockData));
}

geoJsonOS.on('finish', function () {
    process.stdout.write("OsmToGeoJson assertion 2...");
    var result = require('./target/ESB_light_geoJson.json', "utf8");
    assert.equal(JSON.stringify(ref), JSON.stringify(result), "message");
    process.stdout.write("OK\n");
});

osmToGeoJson.convert(process.stdin, geoJsonOS, onBlock);

