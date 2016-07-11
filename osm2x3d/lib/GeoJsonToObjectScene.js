/**
Open Earth View - osm2x3d
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

var three = require('three');

// var cube = require('./json/cube-3d-shape.json');
// var cube = require('./json/cube.json');
var boxGeometry = {
    "metadata": {
        "version": 4.3,
        "type": "Object",
        "generator": "ClementIgonet"
    },
    "geometries": [{
        "uuid": "C3BF1E70-0BE7-4E6D-B184-C9F1E84A3423",
        "type": "BoxGeometry",
        "width": 45,
        "height": 45,
        "depth": 45
    }],
    "materials": [{
        "uuid": "87D95D6C-6BB4-4B8F-8166-A3A6945BA5E3",
        "type": "MeshBasicMaterial",
        "color": "0x00ffff",
    }],
    "object": {
        "uuid": "89529CC6-CBAC-412F-AFD1-FEEAE785BA19",
        "type": "Scene",
        "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        "children": [{
            "uuid": "33FA38D9-0AAC-4657-9BBE-5E5780DDFB2F",
            "name": "Box 1",
            "type": "Mesh",
            "geometry": "C3BF1E70-0BE7-4E6D-B184-C9F1E84A3423",
            "material": "87D95D6C-6BB4-4B8F-8166-A3A6945BA5E3",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
        }]
    }
};

function convert(geoJson, options, onConvert) {
    // var origin = (options && options.origin) ? options.origin : null;
    // var loD = (options && options.loD) ? options.loD : 0;
    // var tile = (options && options.tile) ? options.tile : null;
    // var x3dJs = [];
    // for (var idxGJ = 0; idxGJ < geoJson.length; idxGJ++) {
    //     switch (geoJson[idxGJ].type) {
    //         case 'Feature':
    //             if (geoJson[idxGJ].properties.type === 'bounds') {
    //                 var boundCoord = geoJson[idxGJ].geometry.coordinates[0];
    //
    //                 if (!origin) {
    //                     origin = boundCoord[0];
    //                 }
    //                 var size = [
    //                     ((+boundCoord[2][0] - +boundCoord[0][0])) * GEO2METER, ((+boundCoord[2][1] - +boundCoord[0][1])) * GEO2METER
    //                 ];
    //                 x3dJs[x3dJs.length] = createTile(
    //                     [((boundCoord[2][0] - origin[0]) * GEO2METER) / 2.0, ((+origin[1] - boundCoord[0][1]) * GEO2METER) / 2.0],
    //                     size,
    //                     tile);
    //             }
    //             break;
    //         case 'FeatureCollection':
    //             var id = geoJson[idxGJ].properties.id;
    //             x3dJsonBlock = newX3dJsonBld(id);
    //             for (var i = 0; i < geoJson[idxGJ].features.length; i++) {
    //                 var geoJsonBldPart = geoJson[idxGJ].features[i];
    //                 points = [];
    //                 perimeter = 0;
    //                 if (geoJsonBldPart.geometry.coordinates[0].length > 0) {
    //                     var pointRef = geoJsonBldPart.geometry.coordinates[0][geoJsonBldPart.geometry.coordinates[0].length - 1];
    //                     for (var j = 0; j < geoJsonBldPart.geometry.coordinates[0].length; j++) {
    //                         var node = geoJsonBldPart.geometry.coordinates[0][j];
    //                         points[points.length] = [(node[0] - origin[0]) * GEO2METER, (origin[1] - node[1]) * GEO2METER];
    //                         var z = (pointRef[1] - node[1]) * GEO2METER;
    //                         var x = (node[0] - pointRef[0]) * GEO2METER;
    //                         pointRef = node;
    //                         perimeter += Math.sqrt(z * z + x * x);
    //                     }
    //                 }
    //                 var minHeight = (geoJsonBldPart.properties.minHeight) ? +geoJsonBldPart.properties.minHeight : 0;
    //                 var x3dPoints = [];
    //                 for (var iP = 0; iP < points.length; iP++) {
    //                     x3dPoints[x3dPoints.length] = points[iP][0];
    //                     x3dPoints[x3dPoints.length] = points[iP][1];
    //                 }
    //                 var diffuseColor = (geoJsonBldPart.properties.color) ?
    //                     geoToX3dColor(geoJsonBldPart.properties.color) : [
    //                         (((99 + 13 * (1 + height)) % 100) / 100.0), (((99 + 17 * (1 + height)) % 100) / 100.0), (((99 + 23 * (1 + height)) % 100) / 100.0)
    //                     ];
    //                 var height = ((geoJsonBldPart.properties.height) ? geoJsonBldPart.properties.height : 0) - ((roof && roof.height) ? (roof.height) : 0) - minHeight;
    //                 if (!height) {
    //                     height = 9.99
    //                 }
    //                 switch (geoJsonBldPart.properties.type) {
    //                     case 'roof':
    //                         break;
    //                     case 'buildingPart':
    //                         // BldPart roof
    //                         var roof = getGeoJsonRoof(geoJson[idxGJ], geoJsonBldPart.properties.id);
    //
    //                         addBldPart(x3dJsonBlock,
    //                             newX3dJsonBldPart(
    //                                 minHeight,
    //                                 diffuseColor,
    //                                 geoJsonBldPart.properties.levels ? 0.6 : 0,
    //                                 x3dPoints,
    //                                 height));
    //
    //                         // Floors
    //                         if (loD >= 4 && geoJsonBldPart.properties.levels && geoJsonBldPart.properties.height) {
    //                             var floorHeight = (geoJsonBldPart.properties.height - minHeight) / (geoJsonBldPart.properties.levels - geoJsonBldPart.properties.minLevel);
    //                             var level;
    //                             for (level = +geoJsonBldPart.properties.minLevel; level < geoJsonBldPart.properties.levels; level++) {
    //                                 addBldPart(x3dJsonBlock,
    //                                     newX3dJsonBldFloorPart(+minHeight + (level - geoJsonBldPart.properties.minLevel) * floorHeight,
    //                                         x3dPoints));
    //                             }
    //                         }
    //                         break;
    //                 }
    //             }
    //             x3dJs[x3dJs.length] = JSON.parse(JSON.stringify(x3dJsonBlock));
    //             break;
    //     }
    // }
    // var scene = newScene(x3dJs);

    onConvert(boxGeometry);

}

exports.convert = convert;
