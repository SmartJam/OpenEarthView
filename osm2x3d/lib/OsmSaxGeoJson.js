var util = require('util');
var stream = require('stream');
var RGBColor = require('rgbcolor');
var sax = require("sax");

function getRGB(osmColor) {
    if (osmColor) {
        var hexRGB = /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/i.exec(osmColor);
        if (hexRGB) {
            return "rgb("
                    + (parseInt(hexRGB[1], 16)) + ","
                    + (parseInt(hexRGB[2], 16)) + ","
                    + (parseInt(hexRGB[3], 16)) + ")";
        }
        var color = new RGBColor(osmColor);
        if (color.ok) {
            return color.toRGB();
        }
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

function convert(onConvert) {
    "use strict";
    var xmlStream = sax.createStream(true);
    xmlStream.on('error', function (error) {
        console.error("error!", error);
        this._parser.error = null;
        this._parser.resume();
    });
    var blocks = [],
            geoBldParts = {},
            geoRoofs = {},
            nodeMap = {},
            onWay = false,
            onRelation = false;
    var way = {};
    var relation = {};
    xmlStream.on('opentag', function (node) {
        var name = node.name, attributes = node.attributes;
        if (name === 'node') {
            var id = attributes.id;
            var lat = attributes.lat;
            var lon = attributes.lon;
            nodeMap[id] = [+lon, +lat];
        } else if (name === 'way') {
            way.nodes = [];
            way.id = attributes.id;
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
        } else if (name === 'nd' && onWay) {
            if (!nodeMap.hasOwnProperty(attributes.ref)) {
                console.log("ERROR: Cannot link way to this node: " + attributes.ref);
            } else {
                way.nodes[way.nodes.length] = nodeMap[attributes.ref];
            }
        } else if (name === 'tag' && onWay) {
            if (attributes.k === 'building') {
                way.isBld = true;
            } else if (attributes.k === 'building:levels') {
                way.bldLevels = attributes.v;
            } else if (attributes.k === 'building:min_level') {
                way.bldMinLevel = attributes.V;
            } else if (attributes.k === 'height') {
                way.osmBldPartHeight = heightToMeter(attributes.v);
            } else if (attributes.k === 'min_height') {
                way.minHeight = heightToMeter(attributes.v);
            } else if (attributes.k === 'name') {
                way.name = attributes.v;
            } else if (attributes.k === 'building:colour') {
                way.color = attributes.v;
            } else if (attributes.k === 'roof:shape') {
                way.roofShape = attributes.v;
            } else if (attributes.k === 'roof:height') {
                way.roofHeight = attributes.v;
            }
        } else if (name === 'relation') {
            relation.id = attributes.id;
            relation.isBld = false;
            relation.osmBldPartHeight = undefined;
            relation.minHeight = undefined;
            relation.name = undefined;
            relation.pptRoofHeight = undefined;
            relation.roofShape = 'flat';
            onRelation = true;
        } else if (onRelation && name === 'member' && attributes.type === 'way') {
            if (attributes.ref in geoBldParts) {
                var geoBld = getGeoBuilding(relation.id);
                geoBld.features[geoBld.features.length] = geoBldParts[attributes.ref];
                if (geoRoofs[attributes.ref]) {
                    geoBld.features[geoBld.features.length] = geoRoofs[attributes.ref];
                }
            }
        } else if (onRelation && name === 'tag' && attributes.k === 'name') {
            relation.name = attributes.v;
        } else if (onRelation && name === 'tag' && attributes.k === 'building:part' && attributes.v === 'yes') {
            relation.isBld = true;
        } else if (onRelation && name === 'tag' && attributes.k === 'building' && attributes.v === 'yes') {
            relation.isBld = true;
        } else if (onRelation && name === 'tag' && attributes.k === 'type' && attributes.v === 'building') {
            relation.isBld = true;
        } else if (onRelation && name === 'tag' && attributes.k === 'height') {
            relation.osmBldPartHeight = heightToMeter(attributes.v);
        } else if (onRelation && name === 'tag' && attributes.k === 'min_height') {
            relation.minHeight = heightToMeter(attributes.v);
        } else if (onRelation && name === 'tag' && attributes.k === 'roof:shape') {
            relation.roofShape = attributes.v;
        } else if (onRelation && name === 'tag' && attributes.k === 'roof:height') {
            relation.optRoofHeight = attributes.v;
        }
    });
    xmlStream.on('closetag', function (name) {
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
                blocks[blocks.length] = JSON.parse(JSON.stringify(geoBld));
            } else {
                geoBldParts[way.id] = geoBldPart;
                if (geoRoof) {
                    geoRoofs[way.id] = geoRoof;
                }
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
                blocks[blocks.length] = JSON.parse(JSON.stringify(geoBld));
            }
            onRelation = false;
        } else if (name === 'osm') {
            if (onConvert !== undefined) {
                onConvert(blocks);
            }
        }
    });
    return xmlStream;
}

// Functions which will be available to external callers
exports.convert = convert;
