
var RADIUS = 6371000.0;
var GEO2METER = RADIUS * (Math.PI / 180)

function newScene(sceneContent) {
    return {"X3D": {
            "@version": "3.0",
            "@profile": "Immersive",
            "@xmlns:xsd": "http://www.w3.org/2001/XMLSchema-instance",
            "@xsd:noNamespaceSchemaLocation": "http://www.web3d.org/specifications/x3d-3.0.xsd",
            "Scene": {
                "-children": sceneContent
            }
        }
    };
}

function newX3dJsonBld(id) {
    var result = {"Group": {
            "@class": "building",
            "@DEF": id,
            "@id": id,
            "-children": []
        }
    };
//    console.log('id: ' + JSON.stringify(id));
//    console.log('uuu: ' + JSON.stringify(result));
    return result;
}
function addBldPart(x3dJsonBld, x3dJsonBldPart) {
    var children = x3dJsonBld['Group']['-children'];
//    var children = [];
//    console.log('xxx: ' + JSON.stringify(children));
//    console.log('zzz: ' + JSON.stringify(JSON.parse(JSON.stringify(x3dJsonBldPart))));
    children[children.length] = JSON.parse(JSON.stringify(x3dJsonBldPart));
}

//function addBlock(x3dJsonBlockGroup, x3dJsonBlock) {
//    var x3dJsonBlocks = x3dJsonBlockGroup['Group']['-children'];
//}

function newX3dJsonBldPart(minHeight, color, transparency, points, height) {
    var result = {"Transform": {
            "@translation": [0, minHeight, 0],
            "-children": [{"Group": {"@class": "buildingPart",
                        "-children": [{"Shape": {
                                    "-appearance": [{"Appearance": {
                                                "-material": [{"Material": {
                                                            "@diffuseColor": color,
                                                            "@transparency": transparency
                                                        }}]
                                            }}],
                                    "-geometry": [{"Extrusion": {
                                                "@convex": false,
                                                "@creaseAngle": 0.785,
                                                "@crossSection": points,
                                                "@solid": false,
                                                "@endCap": false,
                                                "@spine": [0, 0, 0, 0, height, 0]
                                            }}]
                                }}]
                    }}]
        }
    };
//    console.log('result: ' + JSON.stringify(result));
    return result;
}
function newX3dJsonBldFloorPart(height, points) {
//    console.log("height: " + height);
    var result = {"Transform": {
            "@translation": [0, height, 0],
            "-children": [{"Transform": {"@rotation": '1 0 0 1.5708',
                        "-children": [{"Group": {"@class": "buildingPart",
                                    "-children": [{"Shape": {
                                                "-appearance": [{"Appearance": {
                                                            "-material": [{"Material": {
                                                                        "@diffuseColor": [1, 1, 1],
                                                                        "@transparency": 0
                                                                    }}]
                                                        }}],
                                                "-geometry": [{"Polyline2D": {
                                                            "@lineSegments": points}}]
                                            }}]
                                }}]
                    }}]
        }
    };
//    console.log('yyy: ' + result)
    return result;
}


//                <Transform rotation='1 0 0 1.5708'>




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
 * Create ground tile.
 * @param shift shift from origin
 * @param size ground size
 * @param tile tile url
 */
function createTile(shift, size, tile) {
    var shape = {
        '-geometry': [{"Rectangle2D": {
                    "@size": size
                }}]
    };
    if (tile) {
        shape['-appearance'] = [{"Appearance": {
                    "-texture": [{"ImageTexture": {
                                "@url": tile,
                            }}]
                }}];
    }
    var result = {
        "Transform": {
            "@translation": [shift[0], -0.1, shift[1]],
            "@rotation": '1 0 0 -1.5708',
            "-children": [{"Group": {"@class": "tile",
                        "-children": [{"Shape": shape}]
                    }}]
        }
    };
//    if (tile) {
//        result["-children"][0]
//    }
    return result;
}
//        <Transform translation='57.264285044396 -0.1 -43.3774179598869' rotation='1 0 0 -1.5708'> 
//            <Group> 
//                <Shape> 
//                    <Appearance> 
//                        <ImageTexture url='"http://a.tile.openstreetmap.org/20/308790/394107.png"'/> 
//                    </Appearance> 
//                    <Rectangle2D size='38.1757484360134 28.9212942252524'></Rectangle2D> 
//                </Shape> 
//            </Group> 

//        <Transform translation='0 0 0'>
//            <Group class='tile'>
//                <Shape>
//                    <Appearance>
//                        <ImageTexture>
//                        </ImageTexture>
//                    </Appearance>
//                    <Rectangle2D>
//                    </Rectangle2D>
//                </Shape>
//            </Group>
//        </Transform>
//        <Group class='building'>
//        </Group>
//        
//        <Transform translation='-57.2629602636441 -0.1 -43.3774179598869' rotation='1 0 0 -1.5708'> 
//            <Group> 
//                <Shape> 
//                    <Appearance> 
//                        <ImageTexture url='"http://a.tile.openstreetmap.org/20/308787/394107.png"'/> 
//                    </Appearance> 
//                    <Rectangle2D size='38.1757484360133 28.9212942252524'></Rectangle2D> 
//                </Shape> 
//            </Group> 
//        </Transform> 

/**
 * Convert GeoJSON data to x3dJson data
 * @param geoJson GeoJson buildings.
 * @param options Options.
 * @param onConvert callback at end of conversion
 */
function convert(geoJson, options, onConvert) {
    var origin = (options && options.origin) ? options.origin : null;
    var loD = (options && options.loD) ? options.loD : 0;
    var tile = (options && options.tile) ? options.tile : null;
    var x3dJs = [];
    for (var idxGJ = 0; idxGJ < geoJson.length; idxGJ++) {
        switch (geoJson[idxGJ].type) {
            case "Feature":
                if (geoJson[idxGJ].properties.type === 'bounds') {
                    var boundCoord = geoJson[idxGJ].geometry.coordinates[0];
//                    console.log('boundCoord: ' + JSON.stringify(boundCoord));
//                    boundCoord: [["-73.9862797","40.7481926"],["-73.9852939","40.7481926"],["-73.9852939","40.7486022"],["-73.9862797","40.7486022"]]

                    if (!origin) {
                        origin = boundCoord[0];
                    }
//                  0:0,0--1:X,0
//                    |      |
//                    |      |
//                  3:0,Y--2:X,Y
                    var size = [
                        ((+boundCoord[2][0] - +boundCoord[0][0])) * GEO2METER,
                        ((+boundCoord[2][1] - +boundCoord[0][1])) * GEO2METER];
//                    console.log("size: " + JSON.stringify(size));
//                    console.log("origin: " + JSON.stringify(origin));
//                    console.log("boundCoord: " + JSON.stringify(boundCoord));
                    x3dJs[x3dJs.length] = createTile(
                            [((boundCoord[2][0] - origin[0]) * GEO2METER) / 2.0, ((+origin[1] - boundCoord[0][1]) * GEO2METER) / 2.0],
                            size,
                            tile);
                }
                break;
            case "FeatureCollection":
                var id = geoJson[idxGJ].properties.id;
                x3dJsonBlock = newX3dJsonBld(id);
                for (var i = 0; i < geoJson[idxGJ].features.length; i++) {
                    var geoJsonBldPart = geoJson[idxGJ].features[i];
//                    var my3dBldPart = {};
                    points = [];
                    perimeter = 0;
                    if (geoJsonBldPart.geometry.coordinates[0].length > 0) {
                        var pointRef = geoJsonBldPart.geometry.coordinates[0][geoJsonBldPart.geometry.coordinates[0].length - 1];
                        for (var j = 0; j < geoJsonBldPart.geometry.coordinates[0].length; j++) {
                            var node = geoJsonBldPart.geometry.coordinates[0][j];
                            points[points.length] = [(node[0] - origin[0]) * GEO2METER, (origin[1] - node[1]) * GEO2METER];
                            var z = (pointRef[1] - node[1]) * GEO2METER;
                            var x = (node[0] - pointRef[0]) * GEO2METER;
                            pointRef = node;
                            perimeter += Math.sqrt(z * z + x * x);
                        }
                    }

//                    if (geoJsonBldPart.properties.levels) {
//                        my3dBldPart.levels = +geoJsonBldPart.properties.levels;
//                    }

                    // BldPart roof
                    var roof = getGeoJsonRoof(geoJson[idxGJ], geoJsonBldPart.properties.id);

//                    my3dBldPart.roof = {};
//                    my3dBldPart.roof.shape = "flat";
//                    my3dBldPart.roof.shape = (roof && roof.shape) ? roof.shape : "flat";
//                    my3dBldPart.roof.elevation = ((geoJsonBldPart.properties.height) ? geoJsonBldPart.properties.height : 0)
//                            - ((my3dBldPart.roof && my3dBldPart.roof.elevation) ? my3dBldPart.roof.elevation : 0);
//                    my3dBldPart.roof.points = my3dBldPart.points;
//                    my3dBldPart.roof.height = (roof && roof.height) ? roof.height : 0;

                    var diffuseColor = (geoJsonBldPart.properties.color) ?
                            geoToX3dColor(geoJsonBldPart.properties.color) :
                            [
                                (((13 * (1 + height)) % 100) / 100),
                                (((17 * (1 + height)) % 100) / 100),
                                (((23 * (1 + height)) % 100) / 100)];
                    var minHeight = (geoJsonBldPart.properties.minHeight) ? +geoJsonBldPart.properties.minHeight : 0;
                    var height = ((geoJsonBldPart.properties.height) ? geoJsonBldPart.properties.height : 0)
                            - ((roof && roof.height) ? (roof.height) : 0)
                            - minHeight;
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
                                    minHeight,
                                    diffuseColor,
                                    geoJsonBldPart.properties.levels ? 0.6 : 0,
                                    x3dPoints,
                                    height));

                    // Floors
                    if (loD >= 4 && geoJsonBldPart.properties.levels && geoJsonBldPart.properties.height) {
//                        console.log("geoJsonBldPart.properties.levels: " + geoJsonBldPart.properties.levels);
//                        console.log("geoJsonBldPart.properties.height: " + geoJsonBldPart.properties.height);
//                        console.log("geoJsonBldPart.properties.minLevel: " + geoJsonBldPart.properties.minLevel);
//                        console.log("loD: " + loD);
                        var floorHeight = (geoJsonBldPart.properties.height - minHeight) / (geoJsonBldPart.properties.levels - geoJsonBldPart.properties.minLevel);
                        var level;
                        console.log("geoJsonBldPart.properties.height: " + geoJsonBldPart.properties.height);
                        console.log("geoJsonBldPart.properties.levels: " + geoJsonBldPart.properties.levels);
                        console.log("geoJsonBldPart.properties.minLevel: " + geoJsonBldPart.properties.minLevel);
                        console.log("floorHeight: " + floorHeight);
                        console.log("minHeight: " + minHeight);
                        for (level = +geoJsonBldPart.properties.minLevel; level < geoJsonBldPart.properties.levels; level++) {
                            console.log("level: " + level);
                            console.log("elevation processed: " + (+minHeight + (level - geoJsonBldPart.properties.minLevel) * floorHeight));
                            addBldPart(x3dJsonBlock,
                                    newX3dJsonBldFloorPart(
                                            +minHeight + (level - geoJsonBldPart.properties.minLevel) * floorHeight,
                                            x3dPoints));
                        }
                    }
                }
                x3dJs[x3dJs.length] = JSON.parse(JSON.stringify(x3dJsonBlock));
                break;
        }
    }
    var scene = newScene(x3dJs);
    onConvert(scene);
}

exports.convert = convert;
