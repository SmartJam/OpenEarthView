
var fs = require('fs');
var assert = require('assert');
var geoJsonToX3d = require('./GeoJsonToX3d.js');
var x3dOS = fs.createWriteStream('target/ESB_light.x3d');

//var ref = require('./resources/ESB_light_x3d.json', "utf8");
//var refScene = require('./resources/ESB_light_Scene_x3d.json', "utf8");

var geoJsonBlock = require("./resources/ESB_light_geoJson.json");

onBuilding = function (x3dBuildingData) {
//    console.log(JSON.stringify(x3dBuildingData));
    process.stdout.write("GeoJsonToX3djson assertion 1...");
    assert.equal(JSON.stringify(ref), JSON.stringify(x3dBuildingData), "message");
    process.stdout.write("OK\n");
};

x3dOS.on('finish', function () {
    process.stdout.write("GeoJsonToX3djson assertion 2...");
    var result = require('./target/ESB_light_x3d.json', "utf8");
    assert.equal(JSON.stringify(refScene), JSON.stringify(result), "message");
    process.stdout.write("OK\n");
});

geoJsonToX3d.convert(geoJsonBlock, x3dOS, onBuilding);

