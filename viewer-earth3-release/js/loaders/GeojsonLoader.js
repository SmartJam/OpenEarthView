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

THREE.GeojsonLoader.prototype = {

    constructor: THREE.GeojsonLoader,
    crossOrigin: undefined,

    load: function(url, onLoad, onProgress, onError) {
        var scope = this;
        var loader = new THREE.XHRLoader(scope.manager);
        loader.load(url, function(text) {
            onLoad(scope.parse(JSON.parse(text)));
        }, onProgress, onError);
    },

    setCrossOrigin: function(value) {

        this.crossOrigin = value;

    },

    parse: function(json) {
        var scope = this;
        var tile = new THREE.Object3D();
        var geojsons;
        if (json.constructor === Array) {
            geojsons = json;
        } else {
            geojsons = [json];
        }
        for (var i = 0; i < geojsons.length; i++) {
            var geojson = geojsons[i];
            if (geojson.type == 'Feature' &&
                geojson.properties.type == 'bounds') {
                var boundsGeometry = scope.geoToThreeGeometry(geojson);
                tile.add(new THREE.Mesh(
                    boundsGeometry,
                    new THREE.MeshLambertMaterial({
                        color: 0xCC0000
                    })));
            } else
            if (geojson.type == 'FeatureCollection' &&
                geojson.properties.type == 'building') {
                var building = new THREE.Object3D();
                for (var j = 0; j < geojson.features.length; j++) {
                    var feature = geojson.features[j];
                    if (feature.type == 'Feature' &&
                        feature.properties.type == 'buildingPart') {
                        var depth = (feature.properties.height !== "undefined") ? feature.properties.height : 0;
                        if (feature.geometry.type == 'Polygon') {
                            var shapes = [];
                            for (var k = 0; k < feature.geometry.coordinates.length; k++) {
                                // var plan = new THREE.Object3D(); //create an empty container
                                var myGeometry;
                                var myShape = new THREE.Shape();
                                for (var l = 0; l < feature.geometry.coordinates[k].length; l++) {
                                    var lon = feature.geometry.coordinates[k][l][0];
                                    var lat = feature.geometry.coordinates[k][l][1];
                                    var z = R * 1000 * Math.sin(lat * Math.PI / 180);
                                    var r = (R * 1000 + feature.properties.minHeight) * Math.cos(lat * Math.PI / 180);
                                    var x = r * Math.cos(lon * Math.PI / 180);
                                    var y = r * Math.sin(lon * Math.PI / 180);
                                    if (l == 0) {
                                        myShape.moveTo(x, y, z);
                                    } else {
                                        myShape.lineTo(x, y, z);
                                    }
                                }
                                console.log('myShape:', myShape);
                                shapes[shapes.length] = myShape;
                            }
                            var buildingPart = new THREE.Mesh(
                                new THREE.ExtrudeGeometry(
                                    shapes, {
                                        bevelEnabled: false,
                                        steps: 1,
                                        amount: depth
                                    }
                                ),
                                new THREE.MeshLambertMaterial({
                                    color: 0xCC0000
                                }));
                            building.add(buildingPart);
                        }
                    }
                }
                tile.add(building);
            }
        }
        return tile;
    },


    getShapes: function(coordinates) {
        var shapes = [];
        for (var k = 0; k < coordinates.length; k++) {
            var myGeometry;
            var myShape = new THREE.Shape();
            for (var l = 0; l < coordinates[k].length; l++) {
                var lon = coordinates[k][l][0];
                var lat = coordinates[k][l][1];
                var z = R * 1000 * Math.sin(lat * Math.PI / 180);
                var r = (R * 1000 + feature.properties.minHeight) * Math.cos(lat * Math.PI / 180);
                var x = r * Math.cos(lon * Math.PI / 180);
                var y = r * Math.sin(lon * Math.PI / 180);
                if (l == 0) {
                    myShape.moveTo(x, y, z);
                } else {
                    myShape.lineTo(x, y, z);
                }
            }
            shapes[shapes.length] = myShape;
        }
        return shapes;
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
    }
};
