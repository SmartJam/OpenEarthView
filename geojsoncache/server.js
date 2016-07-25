var path = require('path');
var fs = require('fs');
var os = require('os');
var http = require('http');
var log = require('loglevel');
var querystring = require('querystring');
var url = require('url');

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

fs.fileExists = function(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}

var config = {
    hostname: 'localhost',
    port: 8081,
    path: '/3dtile?format=geojson&xtile=${x}&ytile=${y}&zoom=${z}&factor=${f}',
    serverport: 8083,
    fileExt: 'geojson'
}

// var myPath = "/api/0.6/map?bbox=" +
//     tile2long(+xtile, zoom) + "," +
//     tile2lat(+ytile + 1, zoom) + "," +
//     tile2long(+xtile + 1, zoom) + "," +
//     tile2lat(+ytile, zoom);

var opt = require('node-getopt').create([
    ['c', 'cacheDir=ARG', 'Default cache dir is ' + CACHE_DIR],
    ['d', 'debug', 'print in debug level'],
    ['h', 'hostname=ARG', 'Default hostname is ' + config.hostname],
    ['p', 'port=ARG', 'Default port is ' + config.port],
    ['q', 'path=ARG', 'Default path is ' + config.path],
    ['s', 'serverport=ARG', 'Default server port is ' + config.serverport],
    ['f', 'fileext=ARG', 'Default file extension is xml']
]).bindHelp().parseSystem();

log.setLevel("warn");
if (opt.options.debug) {
    log.setLevel("debug");
}
log.info('log level:', log.getLevel());

if (opt.options.hostname) {
    config.hostname = opt.options.hostname;
}
log.info('config.hostname:', config.hostname);

if (opt.options.port) {
    config.port = opt.options.port;
}
log.info('config.port:', config.port);

if (opt.options.path) {
    config.path = opt.options.path;
}
log.info('config.path:', config.path);

if (opt.options.serverport) {
    config.serverport = opt.options.serverport;
}
log.info('config.serverport:', config.serverport);

if (opt.options.fileext) {
    config.fileExt = opt.options.fileext;
}
log.info('config.fileExt:', config.fileExt);
var contentType = 'text/xml';

switch (config.fileExt) {
    case 'xml':
        contentType = 'text/xml';
        break;
    case 'json':
    case 'geojson':
        contentType = 'application/json';
        break;
    default:
        break;
}
log.info('contentType:', contentType);

var CACHE_DIR = os.homedir() + '/.cache/geojsoncache';
var cacheDir = CACHE_DIR;
cacheDir = (opt.options.cacheDir) ? opt.options.cacheDir : CACHE_DIR;
log.info('cache folder:', cacheDir);
fs.mkdirParentSync(cacheDir);

var activeRequests = {};

var server = http.createServer(function(request, response) {
    var page = url.parse(request.url).pathname;
    log.debug("page:" + page);
    // www.openstreetmap.org/api/0.6/map?bbox=left,bottom,right,top
    // localhost:8082/osmCache/osmXml?tile=zoom,xtile,ytile

    // if (page != '/osmCache/osmXml' && page != '/osmCache/osmJson' ) {
    if (page !== '/oevcache/geojson') {
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
        var minlon = tile2long(+xtile, zoom);
        var minlat = tile2lat(+ytile + 1, zoom);
        var maxlon = tile2long(+xtile + 1, zoom);
        var maxlat = tile2lat(+ytile, zoom);
        var factor = Math.max(0, (zoom - 16));
        var cacheFile = cacheDir + '/' + zoom + '/' + xtile + '/' + ytile + '.' + config.fileExt;
        var cacheFileLock = cacheFile + ".lock";
        var tileId = 'tile_' + zoom + '_' + xtile + '_' + ytile;
        if (!fs.fileExists(cacheFile) && !fs.fileExists(cacheFileLock)) {
            fs.mkdirParentSync(path.dirname(cacheFileLock));
            fs.closeSync(fs.openSync(cacheFileLock, 'w'));
            console.log('Lock file (', cacheFileLock, ')');
            log.debug('Can not access file ' + cacheFile);
            var myPath = config.path.replace('${minlon}', minlon);
            var myPath = myPath.replace('${minlat}', minlat);
            var myPath = myPath.replace('${maxlon}', maxlon);
            var myPath = myPath.replace('${maxlat}', maxlat);
            var myPath = myPath.replace('${x}', xtile);
            var myPath = myPath.replace('${y}', ytile);
            var myPath = myPath.replace('${z}', zoom);
            var myPath = myPath.replace('${f}', factor);

            console.log('cacheFile:', cacheFile);
            console.log("myPath: " + myPath);
            if (!activeRequests.hasOwnProperty(tileId)) {
                activeRequests[tileId] = {};
                activeRequests[tileId].responses = [];
                activeRequests[tileId].responses.push(response);
                activeRequests[tileId].request = http.request({
                    hostname: config.hostname,
                    port: config.port,
                    path: myPath,
                    method: 'GET'
                }, function(osmReadStream) {
                    console.log("pipe to :" + cacheFile);
                    // osmReadStream.headers: {"content-type":"application/json","date":"Mon, 25 Jul 2016 09:10:07 GMT","connection":"close","content-length":"6281"}
                    // console.log('osmReadStream.headers:', JSON.stringify(osmReadStream.headers));
                    osmReadStream.pipe(fs.createWriteStream(cacheFile), {
                        end: true
                    });
                    osmReadStream.on('end', () => {
                        fs.unlinkSync(cacheFileLock);
                        console.log('Unlock file');
                        while (activeRequests[tileId].responses.length > 0) {
                            console.log('Give response (', tileId, ')');
                            var response_ = activeRequests[tileId].responses.pop();
                            var stats = fs.statSync(cacheFile);
                            response_.writeHead(200, osmReadStream.headers);
                            fs.createReadStream(cacheFile).pipe(response_, {
                                end: true
                            });
                        }
                    });
                });
                activeRequests[tileId].request.on('error', function(e) {
                    log.debug('problem with request: ' + e.message);
                });
                activeRequests[tileId].request.end();
            }
        } else if (fs.fileExists(cacheFileLock)) {
            console.log('File locked (' + cacheFileLock + '), waiting for end (', tileId, ')');
            // console.log('activeRequests:', JSON.stringify(activeRequests));
            activeRequests[tileId].responses.push(response);
        } else {
            console.log('No blockers, give response (', tileId, ')');
            var stats = fs.statSync(cacheFile);
            response.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': stats.size
            });
            fs.createReadStream(cacheFile).pipe(response, {
                end: true
            });
        }
    } else {
        // fallback;
        response.writeHead(404, {
            "Content-Type": "text/html"
        });
        response.end();
    }
});
server.listen(config.serverport);

function tile2long(x, z) {
    return (x / Math.pow(2, z) * 360) % 360 - 180;
}

function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}
