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
var log = require('loglevel');
opt = require('node-getopt').create([
        // ['s' , ''                    , 'short option.'],
        // [''  , 'long'                , 'long option.'],
        // ['S' , 'short-with-arg=ARG'  , 'option with argument'],
        // ['L' , 'long-with-arg=ARG'   , 'long option with argument'],
        // [''  , 'color[=COLOR]'       , 'COLOR is optional'],
        // ['m' , 'multi-with-arg=ARG+' , 'multiple option with argument'],
        // [''  , 'no-comment'],
        ['', 'vvv', 'print in trace level'],
        ['', 'vv', 'print in debug level'],
        ['v', '', 'print in info level'],
        // ['v' , 'version'             , 'show version']
    ]) // create Getopt instance
    .bindHelp() // bind option 'help' to default action
    .parseSystem(); // parse command line

// log.setLevel("warn");
log.setLevel("warn");
if (opt.options.vvv) {
    log.setLevel("trace");
} else if (opt.options.vv) {
    log.setLevel("debug");
} else if (opt.options.v) {
    log.setLevel("info");
}

// osmXmlToGeoJson.setLogLevel(log.getLevel());


var server = http.createServer(function(request, response) {
    var page = url.parse(request.url).pathname;
    log.trace("page:" + page);
    if (page != '/geojsontile') {
        log.warning('Will not serve path: ' + page);
        response.writeHead(404, {
            "Content-Type": "text/html"
        });
        response.end();
        return;
    }
    var args = querystring.parse(url.parse(request.url).query);
    log.trace(args);
    if ('zoom' in args && 'xtile' in args && 'ytile' in args) {
        log.info('Serving path: ' + page);
        log.info('args: ' + JSON.stringify(args));
        var factor = ('factor' in args) ? args.factor : 0;
        // wget "http://www.openstreetmap.org/api/0.6/map?bbox=-73.9874267578125,40.74725696280421,-73.98605346679688,40.74829735476796" -O result.osm
        // wget "http://www.openstreetmap.org/api/0.6/tiledata/18/77196/98527" -O tile.osm
        // wget "http://a.tile.openstreetmap.org/18/77196/98527.png"
        // wget "http://a.tile.openstreetmap.org/19/154393/197054.png"
        // wget "localhost:8080/geojsontile?xtile=154394&ytile=197054&zoom=19" -O ESB19_geojson.json

        if (args.zoom >= 16 && args.zoom <= 19) {
            var loD = args.zoom - 15;
            log.trace("Level of Details: " + loD);
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
                path: "/osmCache/osmXml?tile=" +
                    (args.zoom - factor) + "," +
                    Math.floor(args.xtile / (Math.pow(2, factor))) + "," +
                    Math.floor(args.ytile / (Math.pow(2, factor))),
                method: 'GET'
            };
            log.info('for: ', args.zoom + ',' + args.xtile + ',' + args.ytile);
            log.info('options.path:', options.path);
            // var osmRequest = http.request(optionsOverpass, function(osmReadStream) {
            log.info('Requesting: ' + options.hostname + ':' + options.port + options.path);

            var osmRequest = http.request(options, function(osmReadStream) {
                log.info('Get osm map response.')
                var onX3dJsonConvert;
                // var onGeoJsonConvert;
                var myOptions = {
                        origin: [
                            tile2long(+args.xtile, args.zoom),
                            tile2lat(+args.ytile, args.zoom)
                        ],
                        loD: loD,
                        geoJsonExtended: false,
                        zoom: args.zoom,
                        xtile: args.xtile,
                        ytile: args.ytile,
                        bounds: {
                            minlon: tile2long(+args.xtile, +args.zoom),
                            maxlon: tile2long(+args.xtile + 1, +args.zoom),
                            minlat: tile2lat(+args.ytile, +args.zoom),
                            maxlat: tile2lat(+args.ytile + 1, +args.zoom)
                        },
                        factor: factor,
                        logLevel: log.getLevel()
                    }
                    // log.info('myOptions:', JSON.stringify(myOptions));
                    // writeStreamCount++;
                    // if (writeStreamCount > 1) {
                    //     conversionQueue.push(myOptions);
                    // } else {
                converter(myOptions, osmReadStream, response);
                // }
            });
            osmRequest.on('error', function(e) {
                log.trace('problem with request: ' + e.message);
            });
            osmRequest.end();
        }
    } else {
        log.warning("fallback");
        response.writeHead(404, {
            "Content-Type": "text/html"
        });
        response.end();
    }
});
server.listen(8081);

var conversionQueue = [];
var converting = false;
var converter = function(options_, osmReadStream, response) {
    if (converting) {
        log.info('Conversion put in queue: ', options_.zoom, '/', options_.xtile, '/', options_.ytile);
        conversionQueue.push({
            options: options_,
            osmReadStream: osmReadStream,
            response: response
        });
    } else {
        converting = true;
        log.info('converting: ', converting);
        var writeStream = osmXmlToGeoJson.convert(options_, function(geoJson) {
            log.info('Ready to send: ', options_.zoom, '/', options_.xtile, '/', options_.ytile);
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(geoJson));
            converting = false;
            log.info('converting: ', converting);
            while (!converting && conversionQueue.length > 0) {
                var conversion = conversionQueue.pop();
                converter(
                    conversion.options,
                    conversion.osmReadStream,
                    conversion.response);
            }
        });
        if (writeStream !== undefined) {
            log.info('Starting conversion: ', options_.zoom, '/', options_.xtile, '/', options_.ytile);
            osmReadStream.pipe(writeStream, {
                end: true
            });
        }
    }
}

function tile2long(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
}

function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}
