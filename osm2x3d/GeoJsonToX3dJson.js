
var RADIUS = 6300000;
var GEO2METER = RADIUS * (Math.PI / 180)


function newScene(x3dJsonBlock) {
    return {"X3D": {
            "@profile": "Immersive",
            "@version": 3.3,
            "@xsd:noNamespaceSchemaLocation": "http://www.web3d.org/specifications/x3d-3.3.xsd",
            "Scene": {
                "-children": x3dJsonBlock
            }
        }
    };
}

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
function newX3dJsonBlFloordPart(minHeight, points) {
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
function getGeoJsonRoof(geoJsonBlock, id) {
    var result;
    for (var idx = 0; idx < geoJsonBlock.features.length; idx++) {
        if (geoJsonBlock.features[idx].properties.type === "geoRoof" && geoJsonBlock.features[idx].properties.id === id) {
            result = geoJsonBlock.features[idx];
            break;
        }
    }
    return result;
}

function geoToX3dColor(geoColor) {
    var regex = /^rgb: \(([0-9]+), ([0-9]+), ([0-9]+)\)$/
    var result = string.match(regex);
    return [result[1], result[2], result[3]];
}

function isInside(geopoint, geobound) {
    return !(geopoint[0] < geobound.minbound[0]
            || geopoint[0] > geobound.maxbound[0]
            || geopoint[1] < geobound.minbound[1]
            || geopoint[1] > geobound.maxbound[1]);
}

function centroid(geonodes) {
    var sumlon = 0;
    var sumlat = 0;
    for (var i = 0; i < geonodes.length; i++) {
        sumlon += geonodes[i][0];
        sumlat += geonodes[i][1];
    }
    return [
        sumlon / geonodes.length,
        sumlat / geonodes.length
    ];
}

var myOsmGround;

/**
 * Convert GeoJSON data to x3dJson data
 * @param geoJsonBlock Object
 * @param my3dOutputStream Object
 * @param onBlock function
 */
function convert(geoJsonBlock, my3dOutputStream, onBlock) {
//    console.log("geoJsonBlock: " + JSON.stringify(geoJsonBlock));
    x3dJsonBlock = [];

    switch (geoJsonBlock["properties"]["type"]) {
        case "ground":
            break;
        case "building":
            for (var i = 0; i < geoJsonBlock.features.length; i++) {
                var geoJsonBldPart = geoJsonBlock.features[i];
                var my3dBldPart = {};
                points = [];
                perimeter = 0;
                if (geoJsonBldPart.geometry.coordinates[0].length > 0) {
                    var pointRef = geoJsonBldPart.geometry.coordinates[0][geoJsonBldPart.geometry.coordinates[0].length - 1];
                    for (var j = 0; j < geoJsonBldPart.geometry.coordinates[0].length; j++) {
                        var node = geoJsonBldPart.geometry.coordinates[0][j];
                        points[points.length] = [node[0], node[1]];
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
                var roof = getGeoJsonRoof(geoJsonBlock, geoJsonBldPart.properties.id);
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

                var diffuseColor = (geoJsonBldPart.properties.colour !== undefined) ?
                        geoToX3dColor(geoJsonBldPart.properties.colour) :
                        [
                            (((13 * (1 + height)) % 100) / 100),
                            (((17 * (1 + height)) % 100) / 100),
                            (((23 * (1 + height)) % 100) / 100)];
                var height = ((geoJsonBldPart.properties.height) ? geoJsonBldPart.properties.height : 0)
                        - ((roof && roof.height) ? (roof.height) : 0)
                        - geoJsonBldPart.properties.minHeight;
                if (height === undefined) {
                    height = 9.99
                }
                x3dJsonBlock[x3dJsonBlock.length] = newX3dJsonBldPart(
                        +geoJsonBldPart.properties.minHeight,
                        diffuseColor,
                        geoJsonBldPart.properties.levels ? 0.6 : 0,
                        points,
                        height);

                // Floors
                if (geoJsonBldPart.properties.levels && my3dBldPart.height) {
                    var floorHeight = my3dBldPart.height / (geoJsonBldPart.properties.levels - geoJsonBldPart.properties.minLevel);
                    var level;
                    for (level = +geoJsonBldPart.properties.minLevel; level < geoJsonBldPart.properties.levels; level++) {
                        x3dJsonBlock[x3dJsonBlock.length] = newX3dJsonBlFloordPart(
                                +my3dBldPart.elevation + (level - geoJsonBldPart.properties.minLevel) * floorHeight,
                                points);
                    }
                }
            }
            break;
    }
    onBlock(x3dJsonBlock);

    if (my3dOutputStream !== undefined) {
        var scene = newScene(x3dJsonBlock);
        my3dOutputStream.write(JSON.stringify(scene));
        my3dOutputStream.end();
    }
}

exports.convert = convert;
