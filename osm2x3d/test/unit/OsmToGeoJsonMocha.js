var assert = require('assert');
var stream = require('stream');
var fs = require('fs');
var osmToGeoJson = require('../../lib/OsmToGeoJson.js');
var log = require('loglevel');

// log.setLevel("warn");
log.setLevel("debug");

describe('OsmToGeoJson', function() {
    describe('Convert bounds', function() {
        it('should convert bounds as expected', function(done) {
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
        // wget "http://www.openearthview.net/3dtile.php?format=geojson&zoom=18&xtile=134118&ytile=95589" -O geojson18_134118_95589.json
        it('should convert 18_134118_95589 as expected', function(done) {
            fs.createReadStream(
                './resources/18_134118_95589/18_134118_95589_osm.xml').pipe(osmToGeoJson.convert({
                'loD': 2
            }, function(geoJson) {
                assert.equal(
                    JSON.stringify(geoJson),
                    JSON.stringify(require("./resources/18_134118_95589/18_134118_95589_geojson.json")),
                    "message");
                done();
            }));
        });
        it('should convert Empire State Building at LoD 1', function(done) {
            fs.createReadStream(
                './resources/esb/esb_light_osm.xml').pipe(osmToGeoJson.convert({
                'loD': 1
            }, function(geoJson) {
                // log.debug("ESB LoD 1 geoJson:");
                // log.debug(JSON.stringify(geoJson));
                assert.equal(
                    JSON.stringify(geoJson),
                    JSON.stringify(require("./resources/esb/esb_light_geojson_lod1.json")),
                    "message");
                done();
            }));
        });
        it('should convert Empire State Building at LoD 2', function(done) {
            fs.createReadStream(
                './resources/esb/esb_light_osm.xml').pipe(osmToGeoJson.convert({
                'loD': 2,
                'geoJsonExtended': true
            }, function(geoJson) {
                // log.debug("ESB LoD 2 geoJson:");
                // log.debug(JSON.stringify(geoJson));
                assert.equal(
                    JSON.stringify(geoJson),
                    JSON.stringify(require("./resources/esb/esb_light_geojson_lod2_ext.json")),
                    "message");
                done();
            }));
        });
        it('should convert Empire State Building at LoD 3', function(done) {
            fs.createReadStream(
                './resources/esb/esb_light_osm.xml').pipe(osmToGeoJson.convert({
                'loD': 3,
                'geoJsonExtended': true
            }, function(geoJson) {
                // log.debug("ESB LoD 3 geoJson:");
                // log.debug(JSON.stringify(geoJson));
                assert.equal(
                    JSON.stringify(geoJson),
                    JSON.stringify(require("./resources/esb/esb_light_geojson_lod3_ext.json")),
                    "message");
                done();
            }));
        });
        it('should convert Empire State Building at LoD 4', function(done) {
            fs.createReadStream(
                './resources/esb/esb_light_osm.xml').pipe(osmToGeoJson.convert({
                'loD': 4,
                'geoJsonExtended': true
            }, function(geoJson) {
                // log.debug("ESB LoD 4 geoJson:");
                // log.debug(JSON.stringify(geoJson));
                assert.equal(
                    JSON.stringify(geoJson),
                    JSON.stringify(require("./resources/esb/esb_light_geojson_lod4_ext.json")),
                    "message");
                done();
            }));
        });
        it('should convert Empire State Building at LoD 2', function(done) {
            fs.createReadStream(
                './resources/esb/esb_light_osm.xml').pipe(osmToGeoJson.convert({
                'loD': 2,
                'geoJsonExtended': false
            }, function(geoJson) {
                // log.debug("ESB LoD 2 geoJson:");
                // log.debug(JSON.stringify(geoJson));
                assert.equal(
                    JSON.stringify(geoJson),
                    JSON.stringify(require("./resources/esb/esb_light_geojson_lod2.json")),
                    "message");
                done();
            }));
        });
        it('should convert Empire State Building at LoD 3', function(done) {
            fs.createReadStream(
                './resources/esb/esb_light_osm.xml').pipe(osmToGeoJson.convert({
                'loD': 3,
                'geoJsonExtended': false
            }, function(geoJson) {
                // log.debug("ESB LoD 3 geoJson:");
                // log.debug(JSON.stringify(geoJson));
                assert.equal(
                    JSON.stringify(geoJson),
                    JSON.stringify(require("./resources/esb/esb_light_geojson_lod3.json")),
                    "message");
                done();
            }));
        });
        it('should convert Empire State Building at LoD 4', function(done) {
            fs.createReadStream(
                './resources/esb/esb_light_osm.xml').pipe(osmToGeoJson.convert({
                'loD': 4,
                'geoJsonExtended': false
            }, function(geoJson) {
                // log.debug("ESB LoD 4 geoJson:");
                // log.debug(JSON.stringify(geoJson));
                assert.equal(
                    JSON.stringify(geoJson),
                    JSON.stringify(require("./resources/esb/esb_light_geojson_lod4.json")),
                    "message");
                done();
            }));
        });
    });
});

// wget "http://www.openearthview.net/3dtile.php?format=geojson&zoom=18&xtile=134118&ytile=95589" -O 18_134118_95589_geojson.json
// wget "http://www.openstreetmap.org/api/0.6/map?bbox=4.1830444,43.7333986,4.1844177,43.7343909" -O 18_134118_95589_osm.xml
// wget "http://a.tile.openstreetmap.org/18/134118/95589.png" 18_134118_95589_tile.png
// wget "localhost:8081/3dbox?format=geojson&zoom=18&xtile=134118&ytile=95589" -O 18_134118_95589_geojson.json
