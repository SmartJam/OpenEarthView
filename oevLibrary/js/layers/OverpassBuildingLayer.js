/**
Open Earth View - library
The MIT License (MIT)
Copyright (c) 2017 Clément Igonet

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

var toolbox = OpenEarthView.toolbox;
// OpenEarthView.Layer.OverpassBuilding = function(name, urls, options) {
OpenEarthView.Layer.OverpassBuilding = function(name, urls, options) {
    this.name = (name !== undefined) ? name : 'Overpass';
    this.minZoom = 17;
    if (options !== undefined) {
        this.minZoom = (options.minZoom !== undefined) ? options.minZoom : 18;
        // console.log('minZoom: ' + this.minZoom);
    }
    // if (OpenEarthViewLayers.hasOwnProperty(name)) {
    //     console.err('Cannot register this already existing layer !');
    //     return;
    // }
    this.urls = (urls !== undefined) ? urls : [
        'http://overpass-api.de/api/interpreter'
    ];
};

// OpenEarthView.Layer.OverpassBuilding.prototype = {
OpenEarthView.Layer.OverpassBuilding.prototype = {
    constructor: OpenEarthView.Layer.OverpassBuilding,
    type: 'building',
    getName: function() {
        return this.name
    },
    getUrl: function(zoom, xtile, ytile) {
        var scope = this;
        // var urls = OpenEarthViewLayers[scope.name];
        var urlRandom = this.urls[
            Math.floor(Math.random() * this.urls.length)];

        // Process GPS bounds
        minLon = toolbox.tile2long(xtile, zoom);
        maxLon = toolbox.tile2long(xtile + 1, zoom);
        minLat = toolbox.tile2lat(ytile + 1, zoom);
        maxLat = toolbox.tile2lat(ytile, zoom);

        var url = urlRandom;
        url = url + '?data=[out:json];' +
            '(' +
            '(relation["building"](' + minLat + ',' + minLon + ',' + maxLat + ',' + maxLon + ');>;);' +
            '(way["building"](' + minLat + ',' + minLon + ',' + maxLat + ',' + maxLon + ');>;);' +
            '(way["building:part"](' + minLat + ',' + minLon + ',' + maxLat + ',' + maxLon + ');>;);' +
            ');' +
            'out center;'
        return url;
    }
}

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
                        console.log('myTile:', myTile);
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
        console.log('', myTile, ':', JSON.stringify(json));
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
        var buildings = [];
        var buildingParts = {};
        // TODO: deal with empty data ( {} )
        var elements = (overpassJson.hasOwnProperty('elements')) ? overpassJson.elements : [];
        for (var eltIdx = 0; eltIdx < elements.length; eltIdx++) {
            var element = elements[eltIdx];
            switch (element.type) {
                case 'node':
                    nodes[element.id] = element;
                    break;
                case 'way':
                    // building inbound
                    if (element.hasOwnProperty('tags') && element.tags.hasOwnProperty('building') && element.tags.building != 'no') {
                        if (bounds.minLon > element.center.lon || element.center.lon > bounds.maxLon ||
                            bounds.minLat > element.center.lat || element.center.lat > bounds.maxLat) {
                            // break;
                        } else {
                            buildings.push(element);
                        }
                    } else
                    // building part
                    if (element.hasOwnProperty('tags') && element.tags.hasOwnProperty('building:part') && element.tags['building:part'] != 'no') {
                        // buildingParts[element.id] = element;
                        buildings.push(element);
                    }
                    // "id": 53813362,
                    if (element.id === 53813362) {
                        // buildingParts[element.id] = element;
                        buildings.push(element);
                    }

                    break;
                    // case 'relation':
                    //     if (bounds.minLon > element.center.lon || element.center.lon > bounds.maxLon ||
                    //         bounds.minLat > element.center.lat || element.center.lat > bounds.maxLat) {
                    //         break;
                    //     }
                    //     var relation = element;
                    //     console.log();
                    //     if (relation.hasOwnProperty('tags') && relation.tags.hasOwnProperty('building') && relation.tags.building != 'no') {
                    //         console.log('relation is building !');
                    //         if (bounds.minLon > relation.center.lon || relation.center.lon > bounds.maxLon ||
                    //             bounds.minLat > relation.center.lat || relation.center.lat > bounds.maxLat) {
                    //             console.log("relation out of bounds.");
                    //             break;
                    //         }
                    //         console.log("Yes! Relation in bounds !");
                    //         console.log(JSON.stringify(relation));
                    //         for (var memberIdx = 0; nodeIdx < relation.members.length; memberIdx++) {
                    //             var member = relation.members[memberIdx];
                    //             if (member.type == 'way' && buildingParts.hasOwnProperty(member.ref)) {
                    //                 buildings.push(buildingParts[member.ref]);
                    //             }
                    //         }
                    //
                    //     }
                    //     break;
            }
        }
        // Process data here
        for (var bldIdx = 0; bldIdx < buildings.length; bldIdx++) {

            var building = buildings[bldIdx];
            if (bounds.minLon > building.center.lon || building.center.lon > bounds.maxLon ||
                bounds.minLat > building.center.lat || building.center.lat > bounds.maxLat) {
                break;
            }

            console.log('isBuilding !');
            var minHeight = (building.tags.hasOwnProperty('minHeight')) ?
                building.tags.minHeight : 0;
            var roofHeight = (building.tags.hasOwnProperty('roof:height')) ?
                building.tags['roof:height'] : 0;
            var height = (building.tags.hasOwnProperty('height') && building.tags.height != null) ?
                (building.tags.height - roofHeight) : 20;
            var color = (building.tags.hasOwnProperty('color')) ?
                building.tags.color : defaultColor;
            var levels = (building.tags.hasOwnProperty('building:levels')) ?
                building.tags['building:levels'] : 1;
            // building:levels
            if (building.nodes.length <= 2) {
                break;
            }
            for (var level = 0; level < levels; level++) {
                var shapePts = [];
                for (var nodeIdx = 0; nodeIdx < building.nodes.length; nodeIdx++) {
                    var lon = nodes[building.nodes[nodeIdx]].lon;
                    var lat = nodes[building.nodes[nodeIdx]].lat;
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

                // var material = new THREE.MeshPhongMaterial({
                //     color: color,
                //     transparent: false,
                //     opacity: 0.4
                // });
                var material = new THREE.MeshPhongMaterial({
                    color: color,
                    transparent: false,
                    opacity: Math.random()
                });
                if (lod == 4) {
                    material.transparent = true;
                }

                var mesh = new THREE.Mesh(geometry, material);

                mesh.position.z = minHeight;
                tile.add(mesh);
                OpenEarthView.toolbox.singleton.assignUVs(geometry);
            }
        }
        return tile;
        // }
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
