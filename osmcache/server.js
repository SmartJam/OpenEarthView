var path = require('path');
var fs = require('fs');
var os = require('os');
fs.mkdirParentSync = function(dirPath, mode) {
    console.log("dirPath: " + dirPath);
    //Call the standard fs.mkdir
    try {
        fs.mkdirSync(dirPath, mode);
    } catch (e) {
        console.log("error: " + e.code);
        if (e.code === 'EEXIST') {
            // path already exists
        } else if (e.code === 'ENOENT') {
            fs.mkdirParentSync(path.dirname(dirPath), mode);
            fs.mkdirParentSync(dirPath, mode);
        } else {
            throw e;
        }
    }
};

var http = require('http');
var log = require('loglevel');
var querystring = require('querystring');
var url = require('url');

var CACHE_DIR = os.homedir() + '/.overpass/cache'
var opt = require('node-getopt').create([
    ['c', 'cacheDir=ARG', 'Default cache dir is ' + CACHE_DIR],
    ['d', 'debug', 'print in debug level'],
]).bindHelp().parseSystem();


if (cacheDir === undefined) {
    var cacheDir = CACHE_DIR;
}
fs.mkdirParentSync(cacheDir);

log.setLevel("warn");
if (opt.options.debug) {
    log.setLevel("debug");
}

var server = http.createServer(function(request, response) {
    var page = url.parse(request.url).pathname;
    log.debug("page:" + page);
    // www.openstreetmap.org/api/0.6/map?bbox=left,bottom,right,top
    // localhost:8082/osmCache/osmXml?tile=zoom,xtile,ytile

    // if (page != '/osmCache/osmXml' && page != '/osmCache/osmJson' ) {
    if (page != '/osmCache/osmXml') {
        response.writeHead(404, {
            "Content-Type": "text/html"
        });
        response.end();
        return;
    }
    var args = querystring.parse(url.parse(request.url).query);
    log.debug(args);
    if ('tile' in args) {
        var tile = args.tile.split(',');
        var zoom = tile[0];
        var xtile = tile[1];
        var ytile = tile[2];

        var cacheFile = cacheDir + "/" + zoom + "/" + xtile + "/" + ytile + ".xml";
        fs.stat(
            cacheFile,
            function(err, stats) {
                if (err !== null && err.code === 'ENOENT') {
                    //  || !stats.isFile()
                    // TODO: reset file
                    log.debug('Can not access file ' + cacheFile);
                    log.debug('err: ' + err);
                    // Get data from external overpass API
                    // and write it to cache file
                    var myPath = "/api/0.6/map?bbox=" +
                        tile2long(+xtile, zoom) + "," +
                        tile2lat(+ytile + 1, zoom) + "," +
                        tile2long(+xtile + 1, zoom) + "," +
                        tile2lat(+ytile, zoom);
                    console.log("myPath: " + myPath);
                    var osmRequest = http.request({
                        hostname: 'www.openstreetmap.org',
                        port: 80,
                        path: myPath,
                        method: 'GET'
                    }, function(osmReadStream) {
                        console.log("pipe to :" + cacheFile)
                        fs.mkdirParentSync(path.dirname(cacheFile));
                        osmReadStream.pipe(fs.createWriteStream(cacheFile), {
                            end: true
                        });
                        osmReadStream.on('end', () => {
                            response.writeHead(200, {
                                'Content-Type': 'text/xml'
                            });
                            fs.createReadStream(cacheFile).pipe(response, {
                                end: true
                            });
                        });
                    });
                    osmRequest.on('error', function(e) {
                        log.debug('problem with request: ' + e.message);
                    });
                    osmRequest.end();
                } else {
                    response.writeHead(200, {
                        'Content-Type': 'text/xml',
                        'Content-Length': stats.size
                    });
                    fs.createReadStream(cacheFile).pipe(response, {
                        end: true
                    });
                }
                // Return osm data
            }
        );
    } else {
        // fallback;
        response.writeHead(404, {
            "Content-Type": "text/html"
        });
        response.end();
    }
});
server.listen(8082);

function tile2long(x, z) {
    return (x / Math.pow(2, z) * 360) % 360 - 180;
}

function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}
