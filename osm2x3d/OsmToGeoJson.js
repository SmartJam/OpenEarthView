/* global require */

// The rest of the code

//var OsmGround = require('./OsmGround');
// info: https://www.npmjs.com/package/geolib

var RGBColor = require('rgbcolor');

function getRGB(osmColor) {
    var hexRGB = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(osmColor);
    if (hexRGB) {
        return "rgb("
                + (parseInt(result[1], 16)) + ","
                + (parseInt(result[2], 16)) + ","
                + (parseInt(result[3], 16)) + ")";
    }
    var color = new RGBColor(osmColor);
    if (color.ok) {
        return color.toRGB();
    }
    return "rgb(0,0,0)";
}

var geoBlds = {};
function heightToMeter(height) {
    "use strict";
    var result = 1,
            unit = height.substr(height.length - 1);
    switch (unit) {
        case 'm':
            result = height.substr(0, height.length - 1);
            break;
        default:
            result = height;
            break;
    }
//    FILE_LOG(logDEBUG) << "height (meter): " << result << endl;
    return result;
}
function getGeoBuilding(id) {
    "use strict";
    if (!(geoBlds.hasOwnProperty(id))) {
        var geoBld = {
            "type": "FeatureCollection",
            "features": [],
            properties: {
                "id": id,
                "type": "building"
            }
        };
        geoBlds[id] = geoBld;
    }
    return geoBlds[id];
}

function removeBuilding(id) {
    "use strict";
    if (geoBlds.hasOwnProperty(id)) {
        delete geoBlds[id];
    }
}

var geoGroundBlock = {
    "type": "Feature",
    "geometry": {
        "type": "Polygon",
        "coordinates": [[[-73.9860386, 40.7487894], [-73.9860386, 40.7487894], [-73.9860386, 40.7487894], [-73.9860386, 40.7487894]]]
    },
    "properties": {
        "type": "ground"
    }
};
var geoBldPart = {
    "type": "Feature",
    "geometry": {
        "type": "Polygon",
        "coordinates": []
    },
    "properties": {
        "type": "buildingPart",
        "minHeight": 20,
        "minLevel": 5,
        "color": "rgb(223, 55, 54)",
        "levels": 20,
        "height": 75
    }
};
var geoRoof = {
    "type": "Feature",
    "geometry": {
        "type": "Polygon",
        "coordinates": []
    },
    "properties": {
        "type": "geoRoof",
        "color": "rgb(221, 123, 56)",
        "roofShape": "flat",
        "maxHeight": 95
    }
};
var geoBld = {
    "type": "FeatureCollection",
    "features": [geoBldPart, geoRoof],
    "properties": {
        "id": "2098969",
        "type": "building",
        "name": "Empire State Building"
    }
};

function convert(osmInputStream, geoJsonOutputStream, onBlock) {
    "use strict";

    var geoJsonOS = geoJsonOutputStream,
            expat = require('node-expat'),
            parser = new expat.Parser('UTF-8'),
            geoBldParts = {},
            geoRoofs = {},
            nodeMap = {},
            onOsm = false,
            onWay = false,
            onRelation = false;
    var way = {};
    var relation = {};
    parser.on('startElement', function (name, attrs) {
        if (name === 'osm') {
            onOsm = true;
        }

        if (name === 'bounds' && onOsm) {
            var bounds = attrs;
//      console.log(name, attrs)
//      console.log(bounds);
            var minBound = [
                +bounds.minlon,
                +bounds.minlat
            ];
            var maxBound = [
                +bounds.maxlon,
                +bounds.maxlat
            ];
//            console.log(minBound, maxBound);
        } else if (name === 'node') {
            var id = attrs.id;
            var lat = attrs.lat;
            var lon = attrs.lon;
            nodeMap[id] = [+lon, +lat];
//            console.log(id + ":" + JSON.stringify(nodeMap[id]));
        } else if (name === 'way') {
            way.nodes = [];
            way.id = attrs.id;
            way.isBld = false;
            way.name = undefined;
            way.color = undefined;
            way.osmBldPartHeight = undefined;
            way.minHeight = 0;
            way.bldLevels = undefined;
            way.bldMinLevel = 0;
            way.roofHeight = undefined;
            way.roofShape = "flat";
            onWay = true;
//            console.log("way.id: " + attrs.id);
        } else if (name === 'nd' && onWay) {
            if (!nodeMap.hasOwnProperty(attrs.ref)) {
                console.log("ERROR: Cannot link way to this node: " + attrs.ref);
            } else {
                way.nodes[way.nodes.length] = nodeMap[attrs.ref];
            }
        } else if (name === 'tag' && onWay) {
            if (attrs.k === 'building') {
                way.isBld = true;
            } else if (attrs.k === 'building:levels') {
                way.bldLevels = attrs.v;
            } else if (attrs.k === 'building:min_level') {
                way.bldMinLevel = attrs.V;
            } else if (attrs.k === 'height') {
                way.osmBldPartHeight = heightToMeter(attrs.v);
            } else if (attrs.k === 'min_height') {
                way.minHeight = heightToMeter(attrs.v);
            } else if (attrs.k === 'name') {
                way.name = attrs.v;
            } else if (attrs.k === 'building:colour') {
                way.color = attrs.v;
            } else if (attrs.k === 'roof:shape') {
                way.roofShape = attrs.v;
            } else if (attrs.k === 'roof:height') {
                way.roofHeight = attrs.v;
            }
//    console.log(name, attrs)
        } else if (name === 'relation') {
            relation.id = attrs.id;
            relation.isBld = false;
            relation.osmBldPartHeight = undefined;
            relation.minHeight = undefined;
            relation.name = undefined;
            relation.pptRoofHeight = undefined;
            relation.roofShape = 'flat';
            onRelation = true;
        } else if (onRelation && name === 'member' && attrs.type === 'way') {
//            console.log("osmBldParts: " + JSON.stringify(osmBldParts));
            if (attrs.ref in geoBldParts) {
                var geoBld = getGeoBuilding(relation.id);
//                console.log("osmBld: " + JSON.stringify(osmBld));
                geoBld.features[geoBld.features.length] = geoBldParts[attrs.ref];
                if (geoRoofs[attrs.ref]) {
                    geoBld.features[geoBld.features.length] = geoRoofs[attrs.ref];
                }
            }
        } else if (onRelation && name === 'tag' && attrs.k === 'name') {
            relation.name = attrs.v;
        } else if (onRelation && name === 'tag' && attrs.k === 'building:part' && attrs.v === 'yes') {
            relation.isBld = true;
        } else if (onRelation && name === 'tag' && attrs.k === 'building' && attrs.v === 'yes') {
            relation.isBld = true;
        } else if (onRelation && name === 'tag' && attrs.k === 'type' && attrs.v === 'building') {
            relation.isBld = true;
        } else if (onRelation && name === 'tag' && attrs.k === 'height') {
            relation.osmBldPartHeight = heightToMeter(attrs.v);
        } else if (onRelation && name === 'tag' && attrs.k === 'min_height') {
            relation.minHeight = heightToMeter(attrs.v);
        } else if (onRelation && name === 'tag' && attrs.k === 'roof:shape') {
            relation.roofShape = attrs.v;
        } else if (onRelation && name === 'tag' && attrs.k === 'roof:height') {
            relation.optRoofHeight = attrs.v;
        }
    });
    parser.on('endElement', function (name) {
        if (name === 'way') {
            onWay = false;
            if (way.roofShape) {
                var geoRoof = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [way.nodes]
                    },
                    "properties": {
                        "id": way.id,
                        "type": "geoRoof",
                        "color": getRGB(way.color),
                        "roofShape": way.roofShape,
                        "height": way.osmBldPartHeight
                    }
                };
            }
            var geoBldPart = {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [way.nodes]
                },
                "properties": {
                    "id": way.id,
                    "type": "buildingPart",
                    "minHeight": way.minHeight,
                    "minLevel": way.bldMinLevel,
                    "name": way.name,
                    "color": getRGB(way.color),
                    "levels": way.bldLevels,
                    "height": way.osmBldPartHeight
                }
            };
            if (way.isBld) {
                var geoBld = getGeoBuilding(way.id);
                geoBld.features[geoBld.features.length] = geoBldPart;
                if (geoRoof) {
                    geoBld.features[geoBld.features.length] = geoRoof;
                }
                if (onBlock !== undefined) {
                    onBlock(geoBld);
                }
                if (geoJsonOutputStream !== undefined) {
                    geoJsonOutputStream.write(JSON.stringify(geoBld));
                }
            } else {
                geoBldParts[way.id] = geoBldPart;
                if (geoRoof) {
                    geoRoofs[way.id] = geoRoof;
                }
//                console.log("osmBldParts[" + way.id + "]: " + JSON.stringify(osmBldPart));
            }
        } else if (name === 'relation') {
            if (!relation.isBld) {
                removeBuilding(relation.id);
            } else {
                var geoBld = getGeoBuilding(relation.id);
                if (relation.osmBldPartHeight !== undefined) {
                    geoBld.properties.name = relation.name;
                    for (var i = 0; i < geoBld.features.length; i++) {
                        var geoBldPart = geoBld.features[i];
                        if (geoBldPart.properties.height !== undefined) {
                            geoBldPart.properties.height = relation.osmBldPartHeight;
                        }
                        if (geoBldPart.properties.minHeight === undefined) {
                            geoBldPart.properties.minHeight = relation.minHeight;
                        }
                    }
                }
                if (onBlock !== undefined) {
                    onBlock(geoBld);
                }
                if (geoJsonOutputStream !== undefined) {
                    geoJsonOutputStream.write(JSON.stringify(geoBld));
                }
            }
//            console.log('relation: ' + JSON.stringify(relation));
            onRelation = false;
        } else if (name === 'osm') {
//            console.log("osmBlds: " + JSON.stringify(osmBlds, null, 2));
            if (geoJsonOutputStream !== undefined) {
                geoJsonOutputStream.end();
            }
        }
//    console.log(name)
    });
    parser.on('text', function (text) {
//    console.log(text)
    });
    parser.on('error', function (error) {
//    console.error(error)
    });
    var readline = require('readline');
    var osmIS = osmInputStream;
    if (osmIS === undefined) {
        osmIS = process.stdin;
    }

    var rl = readline.createInterface({
        input: osmIS
//,
//        output: myOsmOS
    });
    rl.on('line', function (block) {
//    console.log('Read: '+block);
        parser.write(block);
    });
//    console.log("osmBld: " + JSON.stringify(osmBld));

}


// Functions which will be available to external callers
exports.convert = convert;

//osmToJSON();

