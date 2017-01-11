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

var singleton = undefined;

THREE.OverpassJsonLoader = function(manager) {
    this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
    if (singleton === undefined) {
        singleton = this;
    }
};

var R = 6378.137;

var overpassJsons = {};
var overpassJsonRequests = {};
var overpassJsonAliveRequests = {};
var overpassJsonAliveRequestsCount = 0;
var overpassJsonRequestsCount = 0;
var MAX_OVERPASS_JSON_REQUEST = 10;

THREE.OverpassJsonLoader.getSingleton = function() {
    if (singleton === undefined) {
        singleton = new THREE.OverpassJsonLoader();
    }
    return singleton;
}

THREE.OverpassJsonLoader.prototype = {

    constructor: THREE.OverpassJsonLoader,
    crossOrigin: undefined,
    load: function(myTile, url, onLoad, onProgress, onError, lod, defaultColor) {
        var myUrl = new URL(url);
        var tilePath = myUrl.pathname + myUrl.search;
        var scope = this;
        var loader = new THREE.XHRLoader(scope.manager);
        if (overpassJsons.hasOwnProperty(tilePath)) {
            overpassJson = overpassJsons[tilePath];
            try {
                var myOverpassJson = JSON.parse(overpassJson);
                onLoad(scope.parse(myOverpassJson, myTile, lod, defaultColor));
            } catch (e) {
                console.error('Cannot parse overpassJson data (' + tilePath + ')');
                console.error('Error message: ', e.message);
                onLoad(scope.parse({}, myTile, lod, defaultColor));
            }
        } else {
            overpassJsonRequestsCount = overpassJsonRequestsCount +
                (overpassJsonRequests.hasOwnProperty(tilePath) ? 0 : 1);
            overpassJsonRequests[tilePath] = {
                myTile: myTile,
                url: url,
                onLoad: onLoad,
                onProgress: onProgress,
                onError: onError,
                lod: lod,
                defaultColor: defaultColor
            }
            scope.loadNextOverpassJson();
        }
    },

    loadNextOverpassJson: function() {
        var scope = this;
        var loader = new THREE.XHRLoader(scope.manager);
        while (overpassJsonAliveRequestsCount < MAX_OVERPASS_JSON_REQUEST && overpassJsonRequestsCount > 0) {
            var tilePaths = Object.keys(overpassJsonRequests);
            var tilePath = tilePaths[tilePaths.length - 1];
            overpassJsonAliveRequestsCount = overpassJsonAliveRequestsCount +
                (overpassJsonAliveRequests.hasOwnProperty(tilePath) ? 0 : 1);
            overpassJsonAliveRequests[tilePath] = overpassJsonRequests[tilePath];
            var myTile = overpassJsonAliveRequests[tilePath].myTile;
            var url = overpassJsonAliveRequests[tilePath].url;
            var onLoad = overpassJsonAliveRequests[tilePath].onLoad;
            var onProgress = overpassJsonAliveRequests[tilePath].onProgress;
            var onError = overpassJsonAliveRequests[tilePath].onError;
            var lod = overpassJsonAliveRequests[tilePath].lod;
            var defaultColor = overpassJsonAliveRequests[tilePath].defaultColor;
            delete overpassJsonRequests[tilePath];
            overpassJsonRequestsCount--;
            (function(myTile, url, onLoad, onProgress, onError, lod, defaultColor) {
                loader.load(
                    url,
                    function(overpassJsonTile) {
                        var myUrl = new URL(url);
                        var tilePath = myUrl.pathname + myUrl.search;
                        console.log('tilePath:', tilePath);
                        if (overpassJsonAliveRequests.hasOwnProperty(tilePath)) {
                            delete overpassJsonAliveRequests[tilePath];
                            overpassJsonAliveRequestsCount--;
                            try {
                                var myOverpassJson = JSON.parse(overpassJsonTile);
                                overpassJsons[tilePath] = overpassJsonTile;
                                onLoad(THREE.OverpassJsonLoader.getSingleton().parse(myOverpassJson, myTile, lod, defaultColor));
                            } catch (e) {
                                console.error('Error when parsing overpassJson data (' + tilePath + '): ', overpassJsonTile);
                                console.error(e);
                                onLoad(scope.parse({}, myTile, lod, defaultColor));
                            }
                        }
                        scope.loadNextOverpassJson();
                    }, onProgress,
                    function(overpassJson) {
                        var myUrl = new URL(url);
                        var tilePath = myUrl.pathname + myUrl.search;
                        if (overpassJsonAliveRequests.hasOwnProperty(tilePath)) {
                            delete overpassJsonAliveRequests[tilePath];
                            overpassJsonAliveRequestsCount--;
                        }
                        scope.loadNextOverpassJson();
                    });
            })(myTile, url, onLoad, onProgress, onError, lod, defaultColor);
        }
    },
    setCrossOrigin: function(value) {
        this.crossOrigin = value;
    },

    parse: function(json, myTile, lod, defaultColor) {
        var scope = this;
        var measure = OpenEarthView.toolbox.measure;
        var tile2long = OpenEarthView.toolbox.tile2long;
        var tile2lat = OpenEarthView.toolbox.tile2lat;
        var lonOri, latOri;
        var tile = new THREE.Object3D();
        var overpassJson = json;
        var bounds = {
            minLon: tile2long(myTile.x, myTile.z),
            maxLon: tile2long(myTile.x + 1, myTile.z),
            minLat: tile2lat(myTile.y + 1, myTile.z),
            maxLat: tile2lat(myTile.y, myTile.z)
        }
        console.log('bounds:', JSON.stringify(bounds));
        var lonOri = bounds.minLon;
        var latOri = bounds.maxLat;
        var nodes = {};
        var elements = (overpassJson.hasOwnProperty('elements')) ? overpassJson.elements : [];
        for (var eltIdx = 0; eltIdx < elements.length; eltIdx++) {
            var element = elements[eltIdx];
            switch (element.type) {
                case 'node':
                    nodes[element.id] = element;
                    break;
                case 'way':
                    var way = element;
                    if (way.hasOwnProperty('tags') && way.tags.hasOwnProperty('building')) {
                        console.log('isBuilding !');
                        var minHeight = (way.tags.hasOwnProperty('minHeight')) ?
                            way.tags.minHeight : 0;
                        var roofHeight = (way.tags.hasOwnProperty('roof:height')) ?
                            way.tags['roof:height'] : 0;
                        var height = (way.tags.hasOwnProperty('height') && way.tags.height != null) ?
                            (way.tags.height - roofHeight) : 20;
                        var color = (way.tags.hasOwnProperty('color')) ?
                            way.tags.color : defaultColor;
                        if (way.nodes.length <= 2) {
                            break;
                        }
                        if (bounds.minLon > way.center.lon || way.center.lon > bounds.maxLon ||
                            bounds.minLat > way.center.lat || way.center.lat > bounds.maxLat) {
                            break;
                        }
                        var shapePts = [];
                        for (var nodeIdx = 0; nodeIdx < way.nodes.length; nodeIdx++) {
                            var lon = nodes[way.nodes[nodeIdx]].lon;
                            var lat = nodes[way.nodes[nodeIdx]].lat;
                            var x = ((lon - lonOri) / Math.abs(lonOri - lon)) * measure(latOri, lonOri, latOri, lon);
                            var y = ((lat - latOri) / Math.abs(latOri - lat)) * measure(latOri, lonOri, lat, lonOri);
                            shapePts.push(new THREE.Vector2(x, y));
                        }
                        var shape = new THREE.Shape(shapePts);
                        var extrudeSettings = {
                            amount: height,
                            bevelEnabled: false,
                            bevelSegments: 1,
                            steps: 1,
                            bevelSize: 2,
                            bevelThickness: 1
                        };
                        var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

                        var material = new THREE.MeshPhongMaterial({
                            color: color,
                            transparent: false,
                            opacity: 0.4
                        });
                        if (lod == 4) {
                            material.transparent = true;
                        }

                        var mesh = new THREE.Mesh(geometry, material);

                        mesh.position.z = minHeight;
                        tile.add(mesh);
                        OpenEarthView.toolbox.assignUVs(geometry);
                    }
                    break;
                case 'relation':
                    break;
            }
        }

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
