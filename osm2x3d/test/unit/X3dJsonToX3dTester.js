var fs = require('fs');
var assert = require('assert');
var X3dJsonToX3d = require('../../lib/X3dJsonToX3d.js');
var xmlcompare = require('node-xml-compare');
var stream = require('stream');


var ref = fs.readFileSync('../resources/ESB_light.x3d', 'utf8');

var x3dJson = require('../resources/ESB_light_x3d.json');

var result = '';
var writable = new stream.Writable({
    write: function (chunk, encoding, next) {
        result += chunk.toString();
        next()
    }
});


//var outputStream = fs.createWriteStream('./target/ESB_light.x3d');

process.stdout.write("X3dJsonToX3d assertion 1...");
X3dJsonToX3d.convert(x3dJson, writable);
//console.log(result);

assert.strictEqual(result, ref.toString(), "message");
process.stdout.write("OK\n");


