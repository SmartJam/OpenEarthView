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

THREE.GeojsonLoader = function(manager) {

    this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;

};

var R = 6378.137;

var geojsons = {};
var geojsonRequests = {};
var geojsonAliveRequests = {};
var geojsonAliveRequestsCount = 0;
var geojsonRequestsCount = 0;
var MAX_GEOJSON_REQUEST = 1;

THREE.GeojsonLoader.prototype = {

    constructor: THREE.GeojsonLoader,
    crossOrigin: undefined,

    load: function(url, onLoad, onProgress, onError, lod, defaultColor) {
        // console.log('Loading: ', url);
        var scope = this;
        var loader = new THREE.XHRLoader(scope.manager);
        if (geojsons.hasOwnProperty(url)) {
            onLoad(scope.parse(JSON.parse(geojsons[url]), lod, defaultColor));
        } else {
            geojsonRequestsCount = geojsonRequestsCount +
                (geojsonRequests.hasOwnProperty(url) ? 0 : 1);
            geojsonRequests[url] = {
                onLoad: onLoad,
                onProgress: onProgress,
                onError: onError,
                lod: lod,
                defaultColor: defaultColor
            }
            scope.loadNextGeojson();
        }
    },

    loadNextGeojson: function() {
        var scope = this;
        var loader = new THREE.XHRLoader(scope.manager);
        while (geojsonAliveRequestsCount < MAX_GEOJSON_REQUEST && geojsonRequestsCount > 0) {
            var urls = Object.keys(geojsonRequests);
            var url = urls[urls.length - 1];
            geojsonAliveRequestsCount = geojsonAliveRequestsCount +
                (geojsonAliveRequests.hasOwnProperty(url) ? 0 : 1);
            geojsonAliveRequests[url] = geojsonRequests[url];
            var onLoad = geojsonAliveRequests[url].onLoad;
            var onProgress = geojsonAliveRequests[url].onProgress;
            var onError = geojsonAliveRequests[url].onError;
            var lod = geojsonAliveRequests[url].lod;
            var defaultColor = geojsonAliveRequests[url].defaultColor;
            delete geojsonRequests[url];
            geojsonRequestsCount--;
            (function(url, onLoad, onProgress, onError, lod, defaultColor) {
                loader.load(
                    url,
                    function(geojson) {
                        geojsons[url] = geojson;
                        if (geojsonAliveRequests.hasOwnProperty(url)) {
                            onLoad(scope.parse(JSON.parse(geojson), lod, defaultColor));
                            delete geojsonAliveRequests[url];
                            geojsonAliveRequestsCount--;
                        }
                        scope.loadNextGeojson();
                    }, onProgress,
                    function(geojson) {
                        if (geojsonAliveRequests.hasOwnProperty(url)) {
                            delete geojsonAliveRequests[url];
                            geojsonAliveRequestsCount--;
                        }
                        scope.loadNextGeojson();
                    });
            })(url, onLoad, onProgress, onError, lod, defaultColor);
        }
    },
    setCrossOrigin: function(value) {
        this.crossOrigin = value;
    },
    roofMesh: function(feature) {
        // var roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        var prop = feature.properties;
        var lonOri = feature.lonOri;
        var latOri = feature.latOri;
        var roofHeight = feature.roofHeight;
        var minHeight = feature.minHeight;
        var roofMesh = new THREE.Mesh();
        switch (prop['roof:shape']) {
            case 'pyramidal':
                var coords = feature.geometry.coordinates;
                var centroidPt = feature.centroid;
                // console.log('centroidPt:', JSON.stringify(centroidPt));
                var roofGeometry = new THREE.Geometry();
                for (var blndIdx = 0; blndIdx < coords.length; blndIdx++) {
                    var coord = coords[blndIdx];
                    var x1, y1;
                    // var shapePts = [];
                    roofGeometry.vertices = [];
                    for (var crdIdx = 0; crdIdx < coord.length; crdIdx++) {
                        var crd = coord[crdIdx];
                        var x = ((crd[0] - lonOri) / Math.abs(lonOri - crd[0])) * measure(latOri, lonOri, latOri, crd[0]);
                        var y = ((crd[1] - latOri) / Math.abs(latOri - crd[1])) * measure(latOri, lonOri, crd[1], lonOri);
                        roofGeometry.vertices.push(new THREE.Vector3(x, y, 0));
                    }
                    var centroidX = ((centroidPt.geometry.coordinates[0] - lonOri) / Math.abs(lonOri - centroidPt.geometry.coordinates[0])) * measure(latOri, lonOri, latOri, centroidPt.geometry.coordinates[0]);
                    var centroidY = ((centroidPt.geometry.coordinates[1] - latOri) / Math.abs(latOri - centroidPt.geometry.coordinates[1])) * measure(latOri, lonOri, centroidPt.geometry.coordinates[1], lonOri);
                    // console.log('roofGeometry.vertices[', roofGeometry.vertices.length - 1, ']:',
                    //     'THREE.Vector3(',
                    //     centroidX, ',',
                    //     centroidY, ',',
                    //     roofHeight, ')');
                    roofGeometry.vertices.push(new THREE.Vector3(
                        centroidX,
                        centroidY,
                        roofHeight));

                    roofGeometry.faces = [];
                    for (var crdIdx = 0; crdIdx < coord.length; crdIdx++) {
                        // console.log('roofGeometry.faces[', roofGeometry.faces.length, ']:',
                        //     'THREE.Face3(',
                        //     ((crdIdx + 1) % (roofGeometry.vertices.length - 2)), ',',
                        //     crdIdx, ',',
                        //     (roofGeometry.vertices.length - 1), ')');
                        roofGeometry.faces.push(
                            new THREE.Face3(
                                (crdIdx + 1) % (roofGeometry.vertices.length - 2),
                                crdIdx,
                                roofGeometry.vertices.length - 1));
                    }

                    var roofMaterial = new THREE.MeshPhongMaterial({
                        color: 0xFFFF00,
                        transparent: false,
                        opacity: 0.9
                    });

                    roofMesh.geometry = roofGeometry;
                    roofMesh.material = roofMaterial;
                    roofMesh.position.z = minHeight;
                    // assignUVs(roofMesh);
                }
                break;
        }
        return roofMesh;
    },
    parse: function(json, lod, defaultColor) {
        var scope = this;
        var lonOri, latOri;
        var tile = new THREE.Object3D();
        var geojsons;
        if (json.constructor === Array) {
            geojsons = json;
        } else {
            geojsons = [json];
        }

        var lonOri, latOri;
        for (var geoIdx = 0; geoIdx < geojsons.length; geoIdx++) {
            var geojson = geojsons[geoIdx];
            switch (geojson.type) {
                case 'Feature':
                    switch (geojson.properties.type) {
                        case 'bounds':
                            var coords = geojson.geometry.coordinates;
                            for (var blndIdx = 0; blndIdx < coords.length; blndIdx++) {
                                var coord = coords[blndIdx];
                                var shape = new THREE.Shape();
                                lonOri = Math.min(Math.min(coord[0][0], coord[1][0]), coord[2][0]);
                                var lon = Math.max(Math.max(coord[0][0], coord[1][0]), coord[2][0]);
                                var lat = Math.min(Math.min(coord[0][1], coord[1][1]), coord[2][1]);
                                latOri = Math.max(Math.max(coord[0][1], coord[1][1]), coord[2][1]);
                                var xWidth = measure(latOri, lonOri, latOri, lon);
                                var yWidth = -measure(latOri, lonOri, lat, lonOri);
                                shape.moveTo(0, 0);
                                shape.lineTo(xWidth, 0);
                                shape.lineTo(xWidth, yWidth);
                                shape.lineTo(0, yWidth);
                                shape.lineTo(0, 0);

                                shape.autoClose = true;
                                var points = shape.createPointsGeometry();

                                var material = new THREE.LineBasicMaterial({
                                    color: 0xff0000,
                                    linewidth: 3
                                });
                                var mesh = new THREE.Line(points, material);
                                mesh.position.z = 1;
                                // tile.add(mesh);
                            }
                            break;
                    }
                    break;
                case 'FeatureCollection':
                    switch (geojson.properties.type) {
                        case 'building':
                            for (var ftrIdx = 0; ftrIdx < geojson.features.length; ftrIdx++) {
                                var feature = geojson.features[ftrIdx];
                                var prop = feature.properties;
                                switch (prop.type) {
                                    case 'buildingPart':
                                        var minHeight = (prop.hasOwnProperty('minHeight')) ?
                                            prop.minHeight : 0;
                                        var roofHeight = (prop.hasOwnProperty('roof:height')) ?
                                            prop['roof:height'] : 0;
                                        var height = (prop.hasOwnProperty('height') && prop.height != null) ?
                                            (prop.height - roofHeight) : 20;
                                        var color = (prop.hasOwnProperty('color')) ?
                                            prop.color : defaultColor;
                                        var coords = feature.geometry.coordinates;
                                        if (prop.hasOwnProperty('roof:shape')) {
                                            switch (prop['roof:shape']) {
                                                case 'pyramidal':
                                                    feature.centroid = turf.centroid(geojson);
                                                    feature.lonOri = lonOri;
                                                    feature.latOri = latOri;
                                                    feature.roofHeight = roofHeight;
                                                    feature.minHeight = minHeight;
                                                    tile.add(scope.roofMesh(feature));
                                                    break;
                                            }
                                        }
                                        for (var blndIdx = 0; blndIdx < coords.length; blndIdx++) {
                                            var coord = coords[blndIdx];
                                            var x1, y1;
                                            var shapePts = [];

                                            for (var crdIdx = 0; crdIdx < coord.length; crdIdx++) {
                                                var crd = coord[crdIdx];
                                                var x = ((crd[0] - lonOri) / Math.abs(lonOri - crd[0])) * measure(latOri, lonOri, latOri, crd[0]);
                                                var y = ((crd[1] - latOri) / Math.abs(latOri - crd[1])) * measure(latOri, lonOri, crd[1], lonOri);
                                                shapePts.push(new THREE.Vector2(x, y));
                                            }

                                            var shape = new THREE.Shape(shapePts);
                                            var extrudeSettings = {
                                                amount: height,
                                                bevelEnabled: true,
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
                                            if (lod == 5) {
                                                material.transparent = true;
                                            }

                                            var mesh = new THREE.Mesh(geometry, material);

                                            mesh.position.z = minHeight;
                                            tile.add(mesh);
                                            assignUVs(geometry);
                                        }
                                        break;
                                }
                            }
                            break;
                    }
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
