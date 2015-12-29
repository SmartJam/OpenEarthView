var http = require('http');
var url = require('url');
var querystring = require('querystring');
var osmToGeoJson = require('./OsmToGeoJson.js');
var geoJsonToX3dJson = require('./GeoJsonToX3dJson.js');

var server = http.createServer(function (req, res) {
    console.time("server");
    var page = url.parse(req.url).pathname;
    console.log("page:" + page);
    if (page != '/3dbox') {
        res.writeHead(404, {"Content-Type": "text/html"});
        res.end();
        return;
    }
    var args = querystring.parse(url.parse(req.url).query);
    console.log(args);
    if ('format' in args && 'zoom' in args && 'xtile' in args && 'ytile' in args) {
//wget "http://www.openstreetmap.org/api/0.6/map?bbox=-73.9874267578125,40.74725696280421,-73.98605346679688,40.74829735476796" -O result.txt
        if (args.zoom >= 17) {
            var left = tile2long(+args.xtile, args.zoom);
            var right = tile2long(+args.xtile + 1, args.zoom);
            var top = tile2lat(+args.ytile, args.zoom);
            var bottom = tile2lat(+args.ytile + 1, args.zoom);
            var myPath = "/api/0.6/map?bbox=" + left + "," + bottom + "," + right + "," + top;
            console.log("Path: " + myPath);
            var options = {
                hostname: 'www.openstreetmap.org',
                port: 80,
                path: myPath,
                method: 'GET',
            };
            var req = http.request(options, function (osmResponse) {
//                console.timeEnd("server")
                console.timeEnd("server");
                console.log('Get osm map response.')
                var onX3dJsonConvert;
                var onGeoJsonConvert;
                switch (args.format) {
                    case "geojson":
                        console.log("geojson format.");
                        onGeoJsonConvert = function (geoJson) {
                            console.timeEnd("server");
                            console.log('Conversion to geoJson done.');
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify(geoJson));
                        }
//                        osmToGeoJson.convert(myStream, onGeoJsonConvert);
                        break;
                    case "x3djson":
                        console.log("x3djson format.");
                        onX3dJsonConvert = function (x3dJsonScene) {
                            console.timeEnd("server");
                            console.log('Conversion to x3dJson done.');
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify(x3dJsonScene));
                        };
                        onGeoJsonConvert = function (geoJson) {
                            console.timeEnd("server");
                            console.log('Conversion to geoJson done.');
                            geoJsonToX3dJson.convert(geoJson, [left, top], onX3dJsonConvert);
                        }
                        break;
                }
                if (onGeoJsonConvert) {
                    var osmToGeoJsonWs = osmToGeoJson.convert(onGeoJsonConvert);
                    console.timeEnd("server");
                    console.log('Starting conversion...');
                    osmResponse.pipe(osmToGeoJsonWs);
                } else {
                    res.end();
                }
            });
            req.on('error', function (e) {
                console.log('problem with request: ' + e.message);
            });
            req.end();
        }
    } else {
        console.log("fallback");
    }
});
server.listen(8080);

function tile2long(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
}

function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}