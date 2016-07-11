/**
Open Earth View - osm2x3d
The MIT License (MIT)
Copyright (c) 2016 Clément Igonet

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var http = require('http');
// var httpSync = require('http-sync');
var url = require('url');
var querystring = require('querystring');
// var osmXmlToGeoJson = require('./lib/OsmXmlToGeoJson.js');
var osmXmlToGeoJson = require('./lib/OsmSaxGeoJson.js');
var geoJsonToX3dJson = require('./lib/GeoJsonToX3dJson.js');
var geoJsonToObjectScene = require('./lib/GeoJsonToObjectScene.js');
var x3dJsonToX3d = require('./lib/X3dJsonToX3d.js')
var log = require('loglevel');
opt = require('node-getopt').create([
        // ['s' , ''                    , 'short option.'],
        // [''  , 'long'                , 'long option.'],
        // ['S' , 'short-with-arg=ARG'  , 'option with argument'],
        // ['L' , 'long-with-arg=ARG'   , 'long option with argument'],
        // [''  , 'color[=COLOR]'       , 'COLOR is optional'],
        // ['m' , 'multi-with-arg=ARG+' , 'multiple option with argument'],
        // [''  , 'no-comment'],
        ['d', 'debug', 'print in debug level'],
        // ['v' , 'version'             , 'show version']
    ]) // create Getopt instance
    .bindHelp() // bind option 'help' to default action
    .parseSystem(); // parse command line

log.setLevel("warn");
if (opt.options.debug) {
    log.setLevel("debug");
}

var myBounds = {
    "metadata": {
        "version": 4.3,
        "type": "Object",
        "generator": "ClementIgonet"
    },
    "geometries": [{
        "uuid": "C3BF1E70-0BE7-4E6D-B184-C9F1E84A3423",
        "type": "BoxGeometry",
        "width": 45,
        "height": 45,
        "depth": 45
    }],
    "materials": [{
        "uuid": "87D95D6C-6BB4-4B8F-8166-A3A6945BA5E3",
        "type": "MeshBasicMaterial",
        "color": 0x00ffff,
    }],
    "object": {
        "uuid": "89529CC6-CBAC-412F-AFD1-FEEAE785BA19",
        "type": "Scene",
        "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        "children": [{
            "uuid": "33FA38D9-0AAC-4657-9BBE-5E5780DDFB2F",
            "name": "Box 1",
            "type": "Mesh",
            "geometry": "C3BF1E70-0BE7-4E6D-B184-C9F1E84A3423",
            "material": "87D95D6C-6BB4-4B8F-8166-A3A6945BA5E3",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
        }]
    }
};

var server = http.createServer(function(request, response) {
    var page = url.parse(request.url).pathname;
    log.debug("page:" + page);
    if (page != '/3dtile') {
        response.writeHead(404, {
            "Content-Type": "text/html"
        });
        response.end();
        return;
    }
    var args = querystring.parse(url.parse(request.url).query);
    log.debug(args);
    if ('format' in args && 'zoom' in args && 'xtile' in args && 'ytile' in args) {
        // wget "http://www.openstreetmap.org/api/0.6/map?bbox=-73.9874267578125,40.74725696280421,-73.98605346679688,40.74829735476796" -O result.osm
        // wget "http://www.openstreetmap.org/api/0.6/tiledata/18/77196/98527" -O tile.osm
        // wget "http://www.openearthview.net/osm2x3d.php?zoom=18&xtile=77196&ytile=98527" -O ESB18_old.x3d
        // wget "http://a.tile.openstreetmap.org/18/77196/98527.png"
        // wget "http://a.tile.openstreetmap.org/19/154393/197054.png"
        // wget "localhost:8080/3dtile?format=x3d&xtile=77196&ytile=98527&zoom=18" -O x3d.x3d
        // wget "localhost:8080/3dtile?format=x3djson&xtile=77196&ytile=98527&zoom=18" -O x3djson.json
        // wget "localhost:8080/3dtile?format=geojson&xtile=154394&ytile=197054&zoom=19" -O ESB19_geojson.json
        // wget "localhost:8080/3dtile?format=x3d&xtile=154394&ytile=197054&zoom=19" -O ESB19.x3d
        // wget "http://www.openearthview.net/osm2x3d.php?zoom=19&xtile=154394&ytile=197054" -O ESB19_old.x3d
        // wget "localhost:8081/3dtile?format=x3d&xtile=38598&ytile=49263&zoom=17" -O ESB17.x3d
        // wget "http://www.openearthview.net/osm2x3d.php?zoom=17&xtile=38598&ytile=49263" -O ESB17_old.x3d
        // wget "localhost:8081/3dtile?format=threejs&xtile=154394&ytile=197054&zoom=19" -O ESB19_threejs.json

        if (args.zoom >= 16 && args.zoom <= 19) {
            var loD = args.zoom - 15;
            log.debug("Level of Details: " + loD);
            // var options = {
            //     hostname: 'www.openstreetmap.org',
            //     port: 80,
            //     path: "/api/0.6/map?bbox=" +
            //         tile2long(+args.xtile, args.zoom) + "," + // left
            //         tile2lat(+args.ytile + 1, args.zoom) + "," + // bottom
            //         tile2long(+args.xtile + 1, args.zoom) + "," + // right
            //         tile2lat(+args.ytile, args.zoom), // top
            //     method: 'GET'
            // };
            var options = {
                hostname: 'localhost',
                port: 8082,
                path: "/osmCache/osmXml?tile=" + args.zoom + "," + args.xtile + "," + args.ytile,
                method: 'GET'
            };
            // var osmRequest = http.request(optionsOverpass, function(osmReadStream) {
            var osmRequest = http.request(options, function(osmReadStream) {
                log.debug('Get osm map response.')
                var onX3dJsonConvert;
                // var onGeoJsonConvert;
                var myOptions = {
                    origin: [
                        tile2long(+args.xtile, args.zoom),
                        tile2lat(+args.ytile, args.zoom)
                    ],
                    loD: loD,
                    tile: 'http://a.tile.openstreetmap.org/' + args.zoom + '/' + args.xtile + '/' + args.ytile + '.png',
                    geoJsonExtended: false,
                    zoom: args.zoom,
                    xtile: args.xtile,
                    ytile: args.ytile
                }
                var myWriteStream;
                switch (args.format) {
                    case "osm":
                        log.debug("osm format.");
                        myWriteStream = response;
                        response.setHeader('Content-Type', 'text/xml');
                        // osmReadStream.pipe(response)
                        break;
                    case "geojson":
                        log.debug("geojson format.");
                        // cacheFile = CACHE_DIR + "/" + args.zoom + '/' + args.xtile + '/' + args.ytile + '/' + loD + '_geoJson.json';
                        // if (FILE.exists(cacheFile)) {
                        //     myWriteStream = FIE.toStream(cacheFile);
                        // } else {
                        myWriteStream = osmXmlToGeoJson.convert(myOptions, function(geoJson) {
                            if (opt.options.debug) {
                                console.timeEnd("server");
                            }
                            log.debug('Conversion to geoJson done.');
                            response.setHeader('Content-Type', 'application/json');
                            response.end(JSON.stringify(geoJson));
                        });
                        // }
                        break;
                    case "objectscene":
                        log.debug("JSON Object Scene format 4 data format.");
                        onObjectSceneConvert = function(objectScene) {
                            if (opt.options.debug) {
                                console.timeEnd("server");
                            }
                            log.debug('Conversion to Object Scene done.');
                            response.setHeader('Content-Type', 'application/json');
                            response.end(JSON.stringify(objectScene));
                        };
                        myOptions.geoJsonExtended = true;
                        myWriteStream = osmXmlToGeoJson.convert(myOptions, function(geoJson) {
                            if (opt.options.debug) {
                                console.timeEnd("server");
                            }
                            log.debug('Conversion to geoJson done.');
                            geoJsonToObjectScene.convert(geoJson, myOptions, onObjectSceneConvert);
                            // onObjectSceneConvert(myBounds);
                        });
                        break;
                    case "x3djson":
                        log.debug("x3djson format.");
                        onX3dJsonConvert = function(x3dJsonScene) {
                            if (opt.options.debug) {
                                console.timeEnd("server");
                            }
                            log.debug('Conversion to x3dJson done.');

                            response.setHeader('Content-Type', 'application/json');
                            response.end(JSON.stringify(x3dJsonScene));
                        };
                        myOptions.geoJsonExtended = true;
                        myWriteStream = osmXmlToGeoJson.convert(myOptions, function(geoJson) {
                            if (opt.options.debug) {
                                console.timeEnd("server");
                            }
                            log.debug('Conversion to geoJson done.');
                            geoJsonToX3dJson.convert(geoJson, myOptions, onX3dJsonConvert);
                        });
                        break;
                    case "x3d":
                        log.debug("x3d format.");
                        // myWriteStream = osmXmlToGeoJson.convert(myOptions, onGeoJsonConvert);
                        onX3dJsonConvert = function(x3dJsonScene) {
                            if (opt.options.debug) {
                                console.timeEnd("server");
                            }
                            log.debug('Conversion to x3dJson done.');
                            response.setHeader('Content-Type', 'text/xml');
                            x3dJsonToX3d.convert(x3dJsonScene, response);
                            response.end();
                        };
                        myOptions.geoJsonExtended = true;
                        myWriteStream = osmXmlToGeoJson.convert(myOptions, function(geoJson) {
                            if (opt.options.debug) {
                                console.timeEnd("server");
                            }
                            log.debug('Conversion to geoJson done.');
                            geoJsonToX3dJson.convert(geoJson, myOptions, onX3dJsonConvert);
                        });
                        break;
                    default:
                        response.end();
                        break;
                }
                if (myWriteStream) {
                    log.debug('Starting conversion...');
                    if (opt.options.debug) {
                        console.time("server");
                    }
                    osmReadStream.pipe(myWriteStream, {
                        end: true
                    });
                } else {
                    response.end();
                }
            });
            osmRequest.on('error', function(e) {
                log.debug('problem with request: ' + e.message);
            });
            osmRequest.end();
        }
    } else {
        log.debug("fallback");
        response.writeHead(404, {
            "Content-Type": "text/html"
        });
        response.end();
    }
});
server.listen(8081);

function tile2long(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
}

function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}
