var assert = require('assert');
var stream = require('stream');
var fs = require('fs');
var osmToGeoJson = require('../../lib/OsmToGeoJson.js');
refBoundsGeojson = require("../resources/boundsGeojson.json");
ref18_134118_95589Geojson = require("../resources/18_134118_95589_geojson.json");

describe('OsmToGeoJson', function() {
    describe('Convert bounds', function() {
        it('should convert bounds as expected', function(done) {
            var readableStream = fs.createReadStream('../resources/boundsOsm.xml');
            readableStream.pipe(osmToGeoJson.convert({
                'loD': 1,
            }, function(geoJson) {
                assert.deepEqual(geoJson, refBoundsGeojson, "message");
                done();
            }));
        });
        // wget "http://www.openearthview.net/3dtile.php?format=geojson&zoom=18&xtile=134118&ytile=95589" -O geojson18_134118_95589.json
        it('should convert 18_134118_95589 as expected', function(done) {
            var readableStream = fs.createReadStream('../resources/18_134118_95589_osm.xml');
            readableStream.pipe(osmToGeoJson.convert({
                'loD': 2,
            }, function(geoJson) {
                assert.deepEqual(geoJson, ref18_134118_95589Geojson, "message");
                done();
            }));
        });
    });
});

// wget "http://www.openearthview.net/3dtile.php?format=geojson&zoom=18&xtile=134118&ytile=95589" -O 18_134118_95589_geojson.json
// wget "http://www.openstreetmap.org/api/0.6/map?bbox=4.1830444,43.7333986,4.1844177,43.7343909" -O 18_134118_95589_osm.xml
// wget "http://a.tile.openstreetmap.org/18/134118/95589.png" 18_134118_95589_tile.png
// wget "localhost:8081/3dbox?format=geojson&zoom=18&xtile=134118&ytile=95589" -O 18_134118_95589_geojson.json
