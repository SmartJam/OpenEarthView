
var fs = require('fs');
var assert = require('assert');
var geoJsonToX3dJson = require('./GeoJsonToX3dJson.js');
var x3dJsonOS = fs.createWriteStream('target/ESB_light_x3d.json');

var ref = require('./resources/ESB_light_x3d.json', "utf8");
var refScene = require('./resources/ESB_light_Scene_x3d.json', "utf8");

var x3dJsonBlock = require("./resources/ESB_light_geoJson.json");

onBuilding = function (x3dBuildingData) {
//    console.log(JSON.stringify(x3dBuildingData));
    process.stdout.write("GeoJsonToX3djson assertion 1...");
    assert.equal(JSON.stringify(ref), JSON.stringify(x3dBuildingData), "message");
    process.stdout.write("OK\n");
};

x3dJsonOS.on('finish', function () {
    process.stdout.write("GeoJsonToX3djson assertion 2...");
    var result = require('./target/ESB_light_x3d.json', "utf8");
    assert.equal(JSON.stringify(refScene), JSON.stringify(result), "message");
    process.stdout.write("OK\n");
});

geoJsonToX3dJson.convert(x3dJsonBlock, x3dJsonOS, onBuilding);

