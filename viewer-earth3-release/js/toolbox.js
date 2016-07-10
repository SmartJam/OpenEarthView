// TOOLBOX //
/**
Open Earth View - viewer-threejs
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
var geoTiles = {};
var geoTileQueue = [];
var MAX_TEXTURE_REQUEST = 10;

getTileMesh = function(r, zoom, ytile, power) {
    var id = 'tile_' + zoom + '_' + ytile + '_' + factor;
    if (!(geoTiles.hasOwnProperty(id))) {
        geoTiles[id] = new THREE.Geometry();
        var myGeometry = geoTiles[id];
        geoTileQueue.push(id);
        if (geoTileQueue.length > MAX_TILEMESH) {
            delete geoTiles[geoTileQueue.shift()];
        }
        /*************************
         *            ^ Y         *
         *            |           *
         *            |           *
         *            |           *
         *            -------> X  *
         *           /            *
         *          /             *
         *         / Z            *
         *************************/
        /***************************
         *       B        C         *
         *                          *
         *                          *
         *                          *
         *      A          D        *
         ***************************/
        var lonStart = tile2long(0, zoom);
        var latStart = tile2lat(ytile, zoom);
        var lonEnd = tile2long(1, zoom);
        var latEnd = tile2lat(ytile + 1, zoom);
        var factor = Math.pow(2, power);
        var lonStep = (lonEnd - lonStart) / factor;
        var latStep = (latEnd - latStart) / factor;
        for (var u = 0; u < factor; u++) {
            for (var v = 0; v < factor; v++) {

                var lon1 = lonStart + lonStep * u;
                var lat1 = latStart + latStep * v;
                var lon2 = lonStart + lonStep * (u + 1);
                var lat2 = latStart + latStep * (v + 1);

                var rUp = r * 1000 * Math.cos(lat1 * Math.PI / 180);
                var rDown = r * 1000 * Math.cos(lat2 * Math.PI / 180);

                var Ax = rDown * Math.sin(lon1 * Math.PI / 180);
                var Ay = r * 1000 * Math.sin(lat2 * Math.PI / 180);
                var Az = rDown * Math.cos(lon1 * Math.PI / 180);

                var Bx = rUp * Math.sin(lon1 * Math.PI / 180);
                var By = r * 1000 * Math.sin(lat1 * Math.PI / 180);
                var Bz = rUp * Math.cos(lon1 * Math.PI / 180);

                var Cx = rUp * Math.sin(lon2 * Math.PI / 180);
                var Cy = r * 1000 * Math.sin(lat1 * Math.PI / 180);
                var Cz = rUp * Math.cos(lon2 * Math.PI / 180);

                var Dx = rDown * Math.sin(lon2 * Math.PI / 180);
                var Dy = r * 1000 * Math.sin(lat2 * Math.PI / 180);
                var Dz = rDown * Math.cos(lon2 * Math.PI / 180);

                myGeometry.vertices.push(
                    new THREE.Vector3(Ax, Ay, Az),
                    new THREE.Vector3(Bx, By, Bz),
                    new THREE.Vector3(Cx, Cy, Cz),
                    new THREE.Vector3(Dx, Dy, Dz)
                );

                var iStep = (factor - v - 1) + u * factor;
                myGeometry.faces.push(new THREE.Face3(
                    4 * iStep,
                    4 * iStep + 2,
                    4 * iStep + 1));
                myGeometry.faces.push(new THREE.Face3(
                    4 * iStep,
                    4 * iStep + 3,
                    4 * iStep + 2));

                myGeometry.faceVertexUvs[0].push([
                    new THREE.Vector2((0.0 + u) / factor, (0.0 + v) / factor),
                    new THREE.Vector2((1.0 + u) / factor, (1.0 + v) / factor),
                    new THREE.Vector2((0.0 + u) / factor, (1.0 + v) / factor)
                ]);
                myGeometry.faceVertexUvs[0].push([
                    new THREE.Vector2((0.0 + u) / factor, (0.0 + v) / factor),
                    new THREE.Vector2((1.0 + u) / factor, (0.0 + v) / factor),
                    new THREE.Vector2((1.0 + u) / factor, (1.0 + v) / factor)
                ]);
            }
        }
        myGeometry.uvsNeedUpdate = true;
    }
    return new THREE.Mesh(geoTiles[id]);
}

assignUVs = function(geometry) {

    geometry.computeBoundingBox();

    var max = geometry.boundingBox.max;
    var min = geometry.boundingBox.min;

    var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
    var range = new THREE.Vector2(max.x - min.x, max.y - min.y);

    geometry.faceVertexUvs[0] = [];
    var faces = geometry.faces;

    for (i = 0; i < geometry.faces.length; i++) {
        var v1 = geometry.vertices[faces[i].a];
        var v2 = geometry.vertices[faces[i].b];
        var v3 = geometry.vertices[faces[i].c];

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
            new THREE.Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
            new THREE.Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
        ]);
    }
    geometry.uvsNeedUpdate = true;
}

var textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = '';
var textures = {};
var textureRequests = {};
var textureAliveRequests = {};
var textureAliveRequestsCount = 0;
var textureRequestsCount = 0;
// var textureRequestQtty = 0;

function loadNextTexture() {
    // console.log('textureAliveRequestsCount:', textureAliveRequestsCount, '/textureRequestsCount:', textureRequestsCount);
    while (textureAliveRequestsCount < MAX_TEXTURE_REQUEST && textureRequestsCount > 0) {
        var ids = Object.keys(textureRequests);
        var id = ids[ids.length - 1];
        textureAliveRequestsCount = textureAliveRequestsCount + (textureAliveRequests.hasOwnProperty(id) ? 0 : 1);
        textureAliveRequests[id] = textureRequests[id];
        var url = textureAliveRequests[id].url;
        delete textureRequests[id];
        textureRequestsCount--;
        (function(url, id) {
            textureAliveRequests[id].request = textureLoader.load(url,
                function(texture) {
                    textures[id] = texture;
                    if (textureAliveRequests.hasOwnProperty(id)) {
                        textureAliveRequests[id].onLoaded(texture);
                        delete textureAliveRequests[id];
                        textureAliveRequestsCount--;
                    }
                    loadNextTexture();
                },
                function() {},
                function() {
                    if (textureAliveRequests.hasOwnProperty(id)) {
                        // textureAliveRequests[id].onLoaded(texture);
                        delete textureAliveRequests[id];
                        textureAliveRequestsCount--;
                    }
                    loadNextTexture();
                }
            );
        })(url, id);
    }
}

function textureFactory(zoom, xtile, ytile, onLoaded) {
    var id = 'tile' + zoom + '_' + xtile + '_' + ytile;
    if (textures.hasOwnProperty(id)) {
        onLoaded(textures[id]);
    } else {
        var serverRandom = TILE_PROVIDER01_RANDOM[
            Math.floor(Math.random() * TILE_PROVIDER01_RANDOM.length)];
        var url = 'http://' + serverRandom + '' + TILE_PROVIDER01 + '/' +
            zoom + '/' +
            ((zoom > 0) ? (xtile % Math.pow(2, zoom)) : 0) + '/' +
            ((zoom > 0) ? (ytile % Math.pow(2, zoom)) : 0) + '.' + TILE_PROVIDER01_FILE_EXT;

        textureRequestsCount = textureRequestsCount + (textureRequests.hasOwnProperty(id) ? 0 : 1);
        textureRequests[id] = {
            url: url,
            onLoaded: onLoaded
        }
        loadNextTexture();
    }
}

function cancelOtherRequests(currentIds) {
    for (var id in textureRequests) {
        if (!currentIds.hasOwnProperty(id)) {
            delete textureRequests[id];
            textureRequestsCount--;
        }
    }
    for (var id in textureAliveRequests) {
        if (!currentIds.hasOwnProperty(id)) {
            // if (textureAliveRequests[id].request.hasOwnProperty('abort')) {
            //     textureAliveRequests[id].request.abort();
            // }
            // delete textureAliveRequests[id];
            // textureAliveRequestsCount--;
        }
    }
    loadNextTexture();
}

//
var materials = {};
var materialQueue = [];

function getSearchParameters() {
    var prmstr = window.location.search.substr(1);
    return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function long2tile(lon, zoom) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
}

function lat2tile(lat, zoom) {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
}

function tile2long(x, z) {
    return ((x / Math.pow(2, z) * 360 - 180) + 540) % 360 - 180;
}

function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

function measure(lat1, lon1, lat2, lon2) { // generally used geo measurement function
    // var R = 6378.137; // Radius of earth in KM
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000; // meters
}

function lonOffsetMeter2lon(lon, lat, x) {
    return x / (R * Math.cos(lat)) + lon;
}

function latOffsetMeter2lat(lat, y) {
    var R = 6378.137;
    return (y / R) + lat;
}
