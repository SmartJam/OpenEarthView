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

        console.log(JSON.stringify(json));
        // json: [{
        //     "type": "Feature",
        //     "properties": {
        //         "type": "bounds",
        //         "tile": "http://a.tile.openstreetmap.org/19/265543/180358.png"
        //     },
        //     "geometry": {
        //         "type": "Polygon",
        //         "coordinates": [
        //             [
        //                 [2.3339081, 48.8615527],
        //                 [2.3345947, 48.8615527],
        //                 [2.3345947, 48.8620045],
        //                 [2.3339081, 48.8620045]
        //             ]
        //         ]
        //     }
        // }]

        var lonOri, latOri;
        var scope = this;
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
            // console.log('geojson:', JSON.stringify(geojson));
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



                                // var line = new THREE.Line( points, new THREE.LineBasicMaterial( { color: color, linewidth: 3 } ) );
                                // line.position.set( x, y, z - 25 );
                                // line.rotation.set( rx, ry, rz );
                                // line.scale.set( s, s, s );
                                // group.add( line );
                                shape.autoClose = true;
                                var points = shape.createPointsGeometry();

                                // var geometry = new THREE.ShapeGeometry(rectShape);
                                var material = new THREE.LineBasicMaterial({
                                    color: 0xff0000,
                                    linewidth: 3
                                });
                                var mesh = new THREE.Line(points, material);
                                mesh.position.z = 1;
                                tile.add(mesh);
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
                                        // console.log('feature:', JSON.stringify(feature));
                                        // feature.properties.minHeight
                                        var minHeight = (prop.hasOwnProperty('minHeight')) ?
                                            prop.minHeight : 0;
                                        var roofHeight = (prop.hasOwnProperty('roof:height')) ?
                                            prop['roof:height'] : 0;
                                        var height = (prop.hasOwnProperty('height')) ?
                                            (prop.height - roofHeight) : 0;
                                        var color = (prop.hasOwnProperty('color')) ?
                                            prop.color : 0xAAAAAA;
                                        var coords = feature.geometry.coordinates;
                                        if (prop.hasOwnProperty('roof:shape')) {
                                            switch (prop['roof:shape']) {
                                                case 'pyramidal':
                                                    var centroidPt = turf.centroid(geojson);
                                                    break;
                                            }
                                        }
                                        for (var blndIdx = 0; blndIdx < coords.length; blndIdx++) {
                                            var coord = coords[blndIdx];
                                            var shape = new THREE.Shape();
                                            var x1, y1;
                                            for (var crdIdx = 0; crdIdx < coord.length; crdIdx++) {
                                                var crd = coord[crdIdx];
                                                var x = measure(latOri, lonOri, latOri, crd[0]);
                                                var y = -measure(latOri, lonOri, crd[1], lonOri);
                                                switch (crdIdx) {
                                                    case 0:
                                                        shape.moveTo(x, y);
                                                        break;
                                                    default:
                                                        shape.lineTo(x, y);
                                                        // console.log('shape.lineTo(', x, y, ');');
                                                }
                                            }
                                            // shape.lineTo(x1, y1);
                                            // console.log('shape.lineTo(', x1, y1, ');');

                                            // var geometry = new THREE.ShapeGeometry(shape);

                                            var extrudeSettings = {
                                                amount: height,
                                                bevelEnabled: true,
                                                bevelSegments: 2,
                                                steps: 2,
                                                bevelSize: 1,
                                                bevelThickness: 1
                                            };
                                            var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);


                                            // assignUVs(geometry);

                                            var material = new THREE.MeshBasicMaterial({
                                                color: color,
                                                transparent: true,
                                                opacity: 0.9
                                            });

                                            // var material = new THREE.ShaderMaterial({
                                            //
                                            //     uniforms: {
                                            //         time: {
                                            //             value: 1.0
                                            //         },
                                            //         resolution: {
                                            //             value: new THREE.Vector2()
                                            //         }
                                            //     },
                                            //     attributes: {
                                            //         vertexOpacity: {
                                            //             value: []
                                            //         }
                                            //     },
                                            //     vertexShader: document.getElementById('vertexShader').textContent,
                                            //     fragmentShader: document.getElementById('fragmentShader').textContent
                                            //
                                            // });

                                            var mesh = new THREE.Mesh(geometry, material);
                                            mesh.position.z = minHeight;
                                            tile.add(mesh);
                                        }
                                        break;
                                }
                            }
                            break;
                    }
                    break;
            }
            // if (geojson.type == 'Feature' &&
            //     geojson.properties.type == 'bounds') {
            //     var boundsGeometry = scope.geoToThreeGeometry(geojson);
            //     tile.add(new THREE.Mesh(
            //         boundsGeometry,
            //         new THREE.MeshLambertMaterial({
            //             color: 0xCC0000
            //         })));
            // }
            // else
            // if (geojson.type == 'FeatureCollection' &&
            //     geojson.properties.type == 'building') {
            //     var building = new THREE.Object3D();
            //     for (var j = 0; j < geojson.features.length; j++) {
            //         var feature = geojson.features[j];
            //         if (feature.type == 'Feature' &&
            //             feature.properties.type == 'buildingPart') {
            //             var depth = (feature.properties.height !== "undefined") ? feature.properties.height : 0;
            //             if (feature.geometry.type == 'Polygon') {
            //                 var shapes = [];
            //                 for (var k = 0; k < feature.geometry.coordinates.length; k++) {
            //                     // var plan = new THREE.Object3D(); //create an empty container
            //                     var myGeometry;
            //                     var myShape = new THREE.Shape();
            //                     for (var l = 0; l < feature.geometry.coordinates[k].length; l++) {
            //                         var lon = feature.geometry.coordinates[k][l][0];
            //                         var lat = feature.geometry.coordinates[k][l][1];
            //                         if (lonORi === undefined) {
            //                             lonOri = tile2long(long2tile(lon, 19), 19);
            //                             console.log('lonOri:', 'lonOri');
            //                         }
            //                         if (latORi === undefined) {
            //                             latOri = tile2lat(lat2tile(lat, 19), 19);
            //                             console.log('latOri:', 'latOri');
            //                         }
            //                         // var z = R * 1000 * Math.sin(lat * Math.PI / 180);
            //                         // var r = (R * 1000 + feature.properties.minHeight) * Math.cos(lat * Math.PI / 180);
            //                         var x = measure(lat, lonOri, lat, lon);
            //                         var y = measure(latOri, lon, lat, lon);
            //                         if (l == 0) {
            //                             myShape.moveTo(x, y);
            //                         } else {
            //                             myShape.lineTo(x, y);
            //                         }
            //                     }
            //                     console.log('myShape:', myShape);
            //                     shapes[shapes.length] = myShape;
            //                 }
            //                 var buildingPart = new THREE.Mesh(
            //                     new THREE.ExtrudeGeometry(
            //                         shapes, {
            //                             bevelEnabled: false,
            //                             steps: 1,
            //                             amount: depth
            //                         }
            //                     ),
            //                     new THREE.MeshLambertMaterial({
            //                         color: 0xCC0000
            //                     }));
            //                 building.add(buildingPart);
            //             }
            //         }
            //     }
            //     tile.add(building);
            // }
        }
        // tile.position.z = 1;
        return tile;
    },

    // getShapes: function(coordinates) {
    //     var shapes = [];
    //     for (var k = 0; k < coordinates.length; k++) {
    //         var myGeometry;
    //         var myShape = new THREE.Shape();
    //         for (var l = 0; l < coordinates[k].length; l++) {
    //             var lon = coordinates[k][l][0];
    //             var lat = coordinates[k][l][1];
    //             var z = R * 1000 * Math.sin(lat * Math.PI / 180);
    //             var r = (R * 1000 + feature.properties.minHeight) * Math.cos(lat * Math.PI / 180);
    //             var x = r * Math.cos(lon * Math.PI / 180);
    //             var y = r * Math.sin(lon * Math.PI / 180);
    //             if (l == 0) {
    //                 myShape.moveTo(x, y, z);
    //             } else {
    //                 myShape.lineTo(x, y, z);
    //             }
    //         }
    //         shapes[shapes.length] = myShape;
    //     }
    //     return shapes;
    // },

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
    // geoToThreeGeometry: function(geojson) {
    //     switch (geojson.geometry.type) {
    //         case 'Polygon':
    //             var coord = geojson.geometry.coordinates;
    //             var i = 0;
    //             lonOri = tile2long(long2tile(lon, 19), 19);
    //             latOri = tile2lat(lat2tile(lat, 19), 19);
    //             for (i = 1; i < coord; i++) {
    //
    //             }
    //             break;
    //     }
    //
    //     var shape = new THREE.Shape();
    //     rectShape.moveTo(0, 0);
    //     rectShape.lineTo(0, rectWidth);
    //     rectShape.lineTo(rectLength, rectWidth);
    //     rectShape.lineTo(rectLength, 0);
    //     rectShape.lineTo(0, 0);
    //
    //     var geometry = new THREE.ShapeGeometry(shape);
    //     return geometry;
    // }
};
