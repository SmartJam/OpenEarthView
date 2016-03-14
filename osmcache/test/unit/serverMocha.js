var assert = require('assert');
var stream = require('stream');
var fs = require('fs');
var log = require('loglevel');

// log.setLevel("warn");
log.setLevel("debug");

describe('OsmToGeoJson', function() {
    describe('Convert bounds', function() {
        it('Shoudld get data from cache', function(done) {
            var myReader = fs.createReadStream('./resources/bounds/boundsOsm.xml');
            var myWriter = osmToGeoJson.convert({
                'loD': 1,
            }, function(geoJson) {
                assert.deepEqual(
                    geoJson,
                    require("./resources/bounds/boundsGeojson.json"),
                    "message");
                done();
            });
            myReader.pipe(myWriter);
        });
    });
});
