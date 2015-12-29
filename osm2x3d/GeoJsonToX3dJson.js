
var RADIUS = 6371000.0;
var GEO2METER = RADIUS * (Math.PI / 180)

function newScene(sceneContent) {
    return {"X3D": {
            "@profile": "Immersive",
            "@version": 3.3,
            "@xsd:noNamespaceSchemaLocation": "http://www.web3d.org/specifications/x3d-3.3.xsd",
            "Scene": {
                "-children": sceneContent
            }
        }
    };
}

function newX3dJsonBld() {
    return {"Group": {
            "@class": "building",
            "-children": []
        }
    };
}
function addBldPart(x3dJsonBld, x3dJsonBldPart) {
    var children = x3dJsonBld['Group']['-children'];
    children[children.length] = JSON.parse(JSON.stringify(x3dJsonBldPart));
}

//function addBlock(x3dJsonBlockGroup, x3dJsonBlock) {
//    var x3dJsonBlocks = x3dJsonBlockGroup['Group']['-children'];
//}

function newX3dJsonBldPart(minHeight, color, transparency, points, height) {
    return {"Transform": {
            "@translation": [0, minHeight, 0],
            "-children": [
                {"Group": {
                        "@class": "buildingPart",
                        "-children": [
                            {"Shape": {
                                    "-appearance": [
                                        {"Appearance": {
                                                "-material": [
                                                    {"Material": {
                                                            "@diffuseColor": color,
                                                            "@transparency": transparency
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ],
                                    "-geometry": [
                                        {"Extrusion": {
                                                "@convex": false,
                                                "@creaseAngle": 0.785,
                                                "@crossSection": points,
                                                "@solid": false,
                                                "@endCap": false,
                                                "@spine": [0, 0, 0, 0, height, 0]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        }
    };
}
function newX3dJsonBldFloorPart(minHeight, points) {
    return {"Transform": {
            "@translation": [0, minHeight, 0],
            "-children": [
                {"Group": {
                        "@class": "buildingPart",
                        "-children": [
                            {"Shape": {
                                    "-appearance": [
                                        {"Appearance": {
                                                "-material": [
                                                    {"Material": {
                                                            "@diffuseColor": [1, 1, 1],
                                                            "@transparency": 0
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ],
                                    "-geometry": [
                                        {"Polyline2D": {
                                                "@lineSegments": points}
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        }
    };
}
function getGeoJsonRoof(geoJson, id) {
    var result;
    for (var idx = 0; idx < geoJson.features.length; idx++) {
        if (geoJson.features[idx].properties.type === "geoRoof" && geoJson.features[idx].properties.id === id) {
            result = geoJson.features[idx];
            break;
        }
    }
    return result;
}

function geoToX3dColor(geoColor) {
//    console.log("geoColor: " + geoColor);
//     rgb(245, 245, 220)
    var regex = /^rgb\(([0-9]+), *([0-9]+), *([0-9]+)\)$/
    var result = geoColor.match(regex);
    return [
        Math.round(parseFloat(result[1], 10) / 2.56) / 100,
        Math.round(parseFloat(result[2], 10) / 2.56) / 100,
        Math.round(parseFloat(result[3], 10) / 2.56) / 100];
}
//Math.round(number * 100) / 100
function isInside(geopoint, geobound) {
    return !(geopoint[0] < geobound.minbound[0]
            || geopoint[0] > geobound.maxbound[0]
            || geopoint[1] < geobound.minbound[1]
            || geopoint[1] > geobound.maxbound[1]);
}

/**
 * Process centroid of set of points.
 * e.g.: geonodes = [[x1,y1],[x2,y2]]
 */
//function centroid(geonodes) {
//    var sumlon = 0;
//    var sumlat = 0;
//    for (var i = 0; i < geonodes.length; i++) {
//        sumlon += geonodes[i][0];
//        sumlat += geonodes[i][1];
//    }
//    return [
//        sumlon / geonodes.length,
//        sumlat / geonodes.length
//    ];
//}

var myOsmGround;

/**
 *                                    
 *              +--------->          
 *              |       X            
 *              |                    
 *              |                    
 * lat  ^       | Y                  
 *      |       v                    
 *      |                            
 *      |    A       B               
 *      |     +-----+    lat=lat_A   
 *      |     |     |                
 *      |     |     |    lon=lon_A   
 *      |     +-----+                
 *      |    D       C               
 *      |                            
 *      +----------------->          
 *                      long         
 *                                    
 */

/**
 * Convert GeoJSON data to x3dJson data
 * @param geoJson GeoJson buildings.
 * @param origin Origon coord.
 * @param onConvert callback at end of conversion
 */
function convert(geoJson, origin, onConvert) {
//    console.log("geoJson: " + JSON.stringify(geoJson));
    x3dJsonBlock = newX3dJsonBld();
    var x3dJsonBlocks = [];
    for (var idxGJ = 0; idxGJ < geoJson.length; idxGJ++) {
//        switch (geoJson["properties"]["type"]) {
//            case "ground":
//                break;
//            case "building":
        // Process centroid
//        var origin;
//            var centroidPart = [];
//        for (var i = 0; i < geoJson[idxGJ].features.length; i++) {
//            var geoJsonBldPart = geoJson[idxGJ].features[i];
////                var centroidGroup = [];
////                for (var idxG = 0; idxG < geoJsonBldPart.geometry.coordinates.length; idxG++) {
////                    centroidGroup[idxG] = centroid(geoJsonBldPart.geometry.coordinates[idxG]);
////                }
////                centroidPart[i] = centroid(centroidGroup);
//        }
//            origin = centroid(centroidPart);

        for (var i = 0; i < geoJson[idxGJ].features.length; i++) {
            var geoJsonBldPart = geoJson[idxGJ].features[i];
            var my3dBldPart = {};
            points = [];
            perimeter = 0;
            if (geoJsonBldPart.geometry.coordinates[0].length > 0) {
                var pointRef = geoJsonBldPart.geometry.coordinates[0][geoJsonBldPart.geometry.coordinates[0].length - 1];
                for (var j = 0; j < geoJsonBldPart.geometry.coordinates[0].length; j++) {
                    var node = geoJsonBldPart.geometry.coordinates[0][j];
//                    console.log("node[0]: " + node[0]);
//                    console.log("origin[0]: " + origin[0]);
                    points[points.length] = [(node[0] - origin[0]) * GEO2METER, (origin[1] - node[1]) * GEO2METER];
                    var z = (pointRef[1] - node[1]) * GEO2METER;
                    var x = (node[0] - pointRef[0]) * GEO2METER;
                    pointRef = node;
                    perimeter += Math.sqrt(z * z + x * x);
                }
            }

            if (geoJsonBldPart.properties.levels) {
                my3dBldPart.levels = +geoJsonBldPart.properties.levels;
            }

            // BldPart roof
            var roof = getGeoJsonRoof(geoJson[idxGJ], geoJsonBldPart.properties.id);
//                x3dJsonBlock[x3dJsonBlock.length] = newX3dJsonBldPartRoof(
//                        +geoJsonBldPart.properties.minHeight,
//                        diffuseColor,
//                        geoJsonBldPart.properties.levels ? 0.6 : 0,
//                        points,
//                        height);

            my3dBldPart.roof = {};
            my3dBldPart.roof.shape = "flat";
            my3dBldPart.roof.shape = (roof && roof.shape) ? roof.shape : "flat";
            my3dBldPart.roof.elevation = ((geoJsonBldPart.properties.height) ? geoJsonBldPart.properties.height : 0)
                    - ((my3dBldPart.roof && my3dBldPart.roof.elevation) ? my3dBldPart.roof.elevation : 0);
            my3dBldPart.roof.points = my3dBldPart.points;
            my3dBldPart.roof.height = (roof && roof.height) ? roof.height : 0;

            var diffuseColor = (geoJsonBldPart.properties.color) ?
                    geoToX3dColor(geoJsonBldPart.properties.color) :
                    [
                        (((13 * (1 + height)) % 100) / 100),
                        (((17 * (1 + height)) % 100) / 100),
                        (((23 * (1 + height)) % 100) / 100)];
            var height = ((geoJsonBldPart.properties.height) ? geoJsonBldPart.properties.height : 0)
                    - ((roof && roof.height) ? (roof.height) : 0)
                    - geoJsonBldPart.properties.minHeight;
            if (!height) {
                height = 9.99
            }
            var x3dPoints = [];
            for (var iP = 0; iP < points.length; iP++) {
                x3dPoints[x3dPoints.length] = points[iP][0];
                x3dPoints[x3dPoints.length] = points[iP][1];
            }
            addBldPart(x3dJsonBlock,
                    newX3dJsonBldPart(
                            (geoJsonBldPart.properties.minHeight) ? +geoJsonBldPart.properties.minHeight : 0,
                            diffuseColor,
                            geoJsonBldPart.properties.levels ? 0.6 : 0,
                            x3dPoints,
                            height));

            // Floors
            if (geoJsonBldPart.properties.levels && my3dBldPart.height) {
                var floorHeight = my3dBldPart.height / (geoJsonBldPart.properties.levels - geoJsonBldPart.properties.minLevel);
                var level;
                for (level = +geoJsonBldPart.properties.minLevel; level < geoJsonBldPart.properties.levels; level++) {
                    addBldPart(x3dJsonBlock,
                            newX3dJsonBldFloorPart(
                                    +my3dBldPart.elevation + (level - geoJsonBldPart.properties.minLevel) * floorHeight,
                                    x3dPoints));
                }
            }
        }
        x3dJsonBlocks[x3dJsonBlocks.length] = JSON.parse(JSON.stringify(x3dJsonBlock));
    }
    var scene = newScene(x3dJsonBlocks);
    onConvert(scene);
}

exports.convert = convert;
