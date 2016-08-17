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

* @author Clement Igonet
*/

THREE.TerrainLoader = function(manager) {

    this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;

};

// var R = 6378.137;
//
var terrains = {};
var terrainRequests = {};
var terrainAliveRequests = {};
var terrainAliveRequestsCount = 0;
var terrainRequestsCount = 0;
var MAX_ELEVATION_REQUEST = 10;

THREE.TerrainLoader.prototype = {

    constructor: THREE.TerrainLoader,
    crossOrigin: undefined,

    load: function(url, onLoad, onProgress, onError) {
        var scope = this;
        var loader = new THREE.XHRLoader(scope.manager);
        if (terrains.hasOwnProperty(url)) {
            terrain = terrains[url];
            try {
                var myTerrain = JSON.parse(terrain);
                onLoad(scope.parse(myTerrain));
            } catch (e) {
                console.error('Cannot parse terrain data (' + url + ')');
                onLoad(scope.parse({}));
            }
        } else {
            terrainRequestsCount = terrainRequestsCount +
                (terrainRequests.hasOwnProperty(url) ? 0 : 1);
            terrainRequests[url] = {
                onLoad: onLoad,
                onProgress: onProgress,
                onError: onError
            }
            scope.loadNextTerrain();
        }
    },

    loadNextTerrain: function() {
        var scope = this;
        var loader = new THREE.XHRLoader(scope.manager);
        while (terrainAliveRequestsCount < MAX_ELEVATION_REQUEST && terrainRequestsCount > 0) {
            var urls = Object.keys(terrainRequests);
            var url = urls[urls.length - 1];
            terrainAliveRequestsCount = terrainAliveRequestsCount +
                (terrainAliveRequests.hasOwnProperty(url) ? 0 : 1);
            console.log('terrainAliveRequestsCount:', terrainAliveRequestsCount);
            terrainAliveRequests[url] = terrainRequests[url];
            var onLoad = terrainAliveRequests[url].onLoad;
            var onProgress = terrainAliveRequests[url].onProgress;
            var onError = terrainAliveRequests[url].onError;
            var lod = terrainAliveRequests[url].lod;
            var defaultColor = terrainAliveRequests[url].defaultColor;
            delete terrainRequests[url];
            terrainRequestsCount--;
            (function(url, onLoad, onProgress, onError) {
                loader.load(
                    url,
                    function(terrain) {
                        if (terrainAliveRequests.hasOwnProperty(url)) {
                            delete terrainAliveRequests[url];
                            terrainAliveRequestsCount--;
                            console.log('terrainAliveRequestsCount:', terrainAliveRequestsCount);
                            try {
                                var myTerrain = JSON.parse(terrain);
                                terrains[url] = terrain;
                                onLoad(scope.parse(myTerrain));
                            } catch (e) {
                                console.error('Cannot parse terrain data (' + url + ')');
                                onLoad(scope.parse({}));
                            }
                        }
                        scope.loadNextTerrain();
                    }, onProgress,
                    function(geojson) {
                        if (terrainAliveRequests.hasOwnProperty(url)) {
                            delete terrainAliveRequests[url];
                            terrainAliveRequestsCount--;
                            console.log('terrainAliveRequestsCount:', terrainAliveRequestsCount);
                        }
                        scope.loadNextTerrain();
                    });
            })(url, onLoad, onProgress, onError, lod, defaultColor);
        }
    },
    setCrossOrigin: function(value) {
        this.crossOrigin = value;
    },
    parse: function(json) {
        // var zoom;
        // var xtile;
        // var ytile;
        // var factor;
        var tile = new THREE.Mesh();
        // var tileGeometry = new THREE.Geometry();
        // tileGeometry.vertices = [];
        // for (int xIdx = 0; xIdx < Math.pow(2, factor), xIdx++) {
        //     for (int yIdx = 0; yIdx < Math.pow(2, factor), yIdx++) {
        //         var x = ((crd[0] - lonOri) / Math.abs(lonOri - crd[0])) * measure(latOri, lonOri, latOri, crd[0]);
        //         var y = ((crd[1] - latOri) / Math.abs(latOri - crd[1])) * measure(latOri, lonOri, crd[1], lonOri);
        //     }
        // }
        // for (var crdIdx = 0; crdIdx < coord.length; crdIdx++) {
        //     var crd = coord[crdIdx];
        //     var x = ((crd[0] - lonOri) / Math.abs(lonOri - crd[0])) * measure(latOri, lonOri, latOri, crd[0]);
        //     var y = ((crd[1] - latOri) / Math.abs(latOri - crd[1])) * measure(latOri, lonOri, crd[1], lonOri);
        //     tileGeometry.vertices.push(new THREE.Vector3(x, y, 0));
        // }
        //
        // tile.geometry = tileGeometry;
        // tile.material = tileMaterial;
        return tile;
    },

    parseMaterials: function(json) {
        var materials = {};
        return materials;
    },

    parseGeometry: function(json) {
        var geometry = new THREE.BufferGeometry();
        return geometry;
    },

    parseObjects: function(json, materials) {
        var scene = new THREE.Scene();
        return scene;
    },
};
