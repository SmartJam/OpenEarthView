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

var CACHE_DIR = os.homedir() + '/.tilecache'
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
    // TODO: check format
    if (true) {
        var zoom;
        var xtile;
        var ytile;

        var cacheFile = cacheDir + page;
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
                    var url = 'http://a.tile.openstreetmap.org' + page;

                    var tileRequest = http.request({
                        hostname: 'a.tile.openstreetmap.org',
                        port: 80,
                        path: page,
                        method: 'GET'
                    }, function(tileReadStream) {
                        console.log(`STATUS: ${tileReadStream.statusCode}`);
                        console.log(`HEADERS: ${JSON.stringify(tileReadStream.headers)}`);
                        console.log("pipe to :" + cacheFile)
                        fs.mkdirParentSync(path.dirname(cacheFile));
                        tileReadStream.pipe(fs.createWriteStream(cacheFile), {
                            end: true
                        });
                        tileReadStream.on('end', () => {
                            response.writeHead(200, {
                                'content-type': 'image/png',
                                'access-control-allow-origin': '*'
                            });
                            // response.writeHead(200, tileReadStream.headers);

                            // HEADERS: {
                            //     "date": "Thu, 28 Apr 2016 20:47:31 GMT",
                            //     "server": "Apache/2.4.7 (Ubuntu)",
                            //     "access-control-allow-origin": "*",
                            //     "etag": "\"ddb4dc9cfe30a8c9c7ef014e8135e59b\"",
                            //     "content-length": "8708",
                            //     "cache-control": "max-age=6964",
                            //     "expires": "Thu, 28 Apr 2016 22:43:35 GMT",
                            //     "content-type": "image/png",
                            //     "age": "1279",
                            //     "x-cache": "HIT from simurgh.openstreetmap.org",
                            //     "x-cache-lookup": "HIT from simurgh.openstreetmap.org:3128",
                            //     "via": "1.1 simurgh.openstreetmap.org:3128 (squid/2.7.STABLE9)",
                            //     "connection": "close"
                            // }


                            fs.createReadStream(cacheFile).pipe(response, {
                                end: true
                            });
                        });
                    });
                    tileRequest.on('error', function(e) {
                        log.debug('problem with request: ' + e.message);
                    });
                    tileRequest.end();
                } else {
                    log.debug('content-length:', stats.size);
                    response.writeHead(200, {
                        'content-type': 'image/png',
                        'access-control-allow-origin': '*',
                        'content-length': stats.size
                    });
                    // response.writeHead(200, {
                    //     'access-control-allow-origin': '*',
                    //     'content-length': stats.size,
                    // });
                    fs.createReadStream(cacheFile).pipe(response, {
                        end: true
                    });
                }
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
server.listen(8084);
