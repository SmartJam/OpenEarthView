var http = require('http');
var url = require('url');
var querystring = require('querystring');
var osmToGeoJson = require('./lib/OsmToGeoJson.js');
var geoJsonToX3dJson = require('./lib/GeoJsonToX3dJson.js');
var x3dJsonToX3d = require('./lib/X3dJsonToX3d.js')

var server = http.createServer(function (request, response) {
    var page = url.parse(request.url).pathname;
    console.log("page:" + page);
    if (page != '/3dbox') {
        response.writeHead(404, {"Content-Type": "text/html"});
        response.end();
        return;
    }
    var args = querystring.parse(url.parse(request.url).query);
    console.log(args);
    if ('format' in args && 'zoom' in args && 'xtile' in args && 'ytile' in args) {
//wget "http://www.openstreetmap.org/api/0.6/map?bbox=-73.9874267578125,40.74725696280421,-73.98605346679688,40.74829735476796" -O result.osm
//wget "http://www.openstreetmap.org/api/0.6/tiledata/18/77196/98527" -O tile.osm
//wget "http://www.openearthview.net/osm2x3d.php?zoom=18&xtile=77196&ytile=98527" -O ESB18_old.x3d
//wget "http://a.tile.openstreetmap.org/18/77196/98527.png"
//wget "http://a.tile.openstreetmap.org/19/154393/197054.png"
//wget "localhost:8080/3dbox?format=x3d&xtile=77196&ytile=98527&zoom=18" -O x3d.x3d
//wget "localhost:8080/3dbox?format=x3djson&xtile=77196&ytile=98527&zoom=18" -O x3djson.json
//wget "localhost:8080/3dbox?format=geojson&xtile=154394&ytile=197054&zoom=19" -O ESB19_geojson.json
//wget "localhost:8080/3dbox?format=x3d&xtile=154394&ytile=197054&zoom=19" -O ESB19.x3d
//wget "http://www.openearthview.net/osm2x3d.php?zoom=19&xtile=154394&ytile=197054" -O ESB19_old.x3d
//wget "localhost:8081/3dbox?format=x3d&xtile=38598&ytile=49263&zoom=17" -O ESB17.x3d
//wget "http://www.openearthview.net/osm2x3d.php?zoom=17&xtile=38598&ytile=49263" -O ESB17_old.x3d

        if (args.zoom >= 16 && args.zoom <= 19) {
            var loD = args.zoom - 15;
            var left = tile2long(+args.xtile, args.zoom);
            var right = tile2long(+args.xtile + 1, args.zoom);
            var top = tile2lat(+args.ytile, args.zoom);
            var bottom = tile2lat(+args.ytile + 1, args.zoom);
            var myPath = "/api/0.6/map?bbox=" + left + "," + bottom + "," + right + "," + top;
            console.log("Path: " + myPath);
            console.log('<bounds minlat="' + bottom + '" minlon="' + left + '" maxlat="' + top + '" maxlon="' + right + '"/>');
            console.log('<bounds minlat="40.7481926" minlon="-73.9862797" maxlat="40.7486022" maxlon="-73.9852939"/>');
            var options = {
                hostname: 'www.openstreetmap.org',
                port: 80,
                path: myPath,
                method: 'GET',
            };
            var request = http.request(options, function (osmReadStream) {
                console.log('Get osm map response.')
                var onX3dJsonConvert;
                var onGeoJsonConvert;
                var options = {
                    'origin': [left, top],
                    'loD': loD,
                    'tile': 'http://a.tile.openstreetmap.org/' + args.zoom + '/' + args.xtile + '/' + args.ytile + '.png'
                }
                switch (args.format) {
                    case "geojson":
                        console.log("geojson format.");
                        onGeoJsonConvert = function (geoJson) {
                            console.timeEnd("server");
                            console.log('Conversion to geoJson done.');
                            response.setHeader('Content-Type', 'application/json');
                            response.end(JSON.stringify(geoJson));
                        }
//                        osmToGeoJson.convert(myStream, onGeoJsonConvert);
                        break;
                    case "x3djson":
                        console.log("x3djson format.");
                        onX3dJsonConvert = function (x3dJsonScene) {
                            console.timeEnd("server");
                            console.log('Conversion to x3dJson done.');
                            response.setHeader('Content-Type', 'application/json');
                            response.end(JSON.stringify(x3dJsonScene));
                        };
                        onGeoJsonConvert = function (geoJson) {
                            console.timeEnd("server");
                            console.log('Conversion to geoJson done.');
//                            geoJsonToX3dJson.convert(geoJson, [left, top], loD, onX3dJsonConvert);
                            geoJsonToX3dJson.convert(geoJson, options, onX3dJsonConvert);
                        }
                        break;
                    case "x3d":
                        console.log("x3djson format.");
                        onX3dJsonConvert = function (x3dJsonScene) {
                            console.timeEnd("server");
                            console.log('Conversion to x3dJson done.');
                            response.setHeader('Content-Type', 'text/xml');
                            x3dJsonToX3d.convert(x3dJsonScene, response);
                            response.end();
                        };
                        onGeoJsonConvert = function (geoJson) {
                            console.timeEnd("server");
                            console.log('Conversion to geoJson done.');
                            geoJsonToX3dJson.convert(geoJson, options, onX3dJsonConvert);
                        }
                        break;
                }
                if (onGeoJsonConvert) {
//                    args.xtile, args.zoom
                    var osmToGeoJsonWriteStream = osmToGeoJson.convert(options, onGeoJsonConvert);
                    console.log('Starting conversion...');
                    console.time("server");
                    osmReadStream.pipe(osmToGeoJsonWriteStream);
                } else {
                    response.end();
                }
            });
            request.on('error', function (e) {
                console.log('problem with request: ' + e.message);
            });
            request.end();
        }
    } else {
        console.log("fallback");
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