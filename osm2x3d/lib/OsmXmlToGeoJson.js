var util = require('util');
var stream = require('stream');
var RGBColor = require('rgbcolor');
var expat = require('node-expat');
var turf = require('turf');
var log = require('loglevel');

log.setLevel("debug");

function getRGB(osmColor) {
    if (osmColor) {
        var hexRGB = /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/i.exec(osmColor);
        if (hexRGB) {
            return "rgb(" + (parseInt(hexRGB[1], 16)) + "," + (parseInt(hexRGB[2], 16)) + "," + (parseInt(hexRGB[3], 16)) + ")";
        }
        var color = new RGBColor(osmColor);
        if (color.ok) {
            return color.toRGB();
        }
    }
    return "rgb(240,240,240)";
}

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

function getGeoBuilding(geoBlds, id) {
    "use strict";
    if (!(geoBlds.hasOwnProperty(id))) {
        var geoBld = {
            "type": "FeatureCollection",
            "features": [],
            properties: {
                "id": +id,
                "type": "building"
            }
        };
        geoBlds[+id] = geoBld;
    }
    return geoBlds[+id];
}

function removeBuilding(geoBlds, id) {
    "use strict";
    if (geoBlds.hasOwnProperty(+id)) {
        delete geoBlds[+id];
    }
}

function groundBlock(bound, url) {
    "use strict";
    var bounds = {
        'type': 'Feature',
        'properties': {
            'type': 'bounds'
        },
        'geometry': {
            'type': 'Polygon',
            'coordinates': [
                [
                    [+bound.minlon, +bound.minlat],
                    [+bound.maxlon, +bound.minlat],
                    [+bound.maxlon, +bound.maxlat],
                    [+bound.minlon, +bound.maxlat]
                ]
            ]
        }
    };
    if (url) {
        bounds['properties']['tile'] = url;
    }
    return bounds;
}


function roofBlock(way) {
    "use strict";
    return {
        "type": "Feature",
        "properties": {
            "id": +way.id,
            "type": "roof",
            "color": getRGB(way.color),
            "roofShape": way.roofShape,
            "height": way.osmBldPartHeight
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [way.nodes]
        }
    };
}

function geoBldPartBlock(way) {
    return {
        'type': 'Feature',
        'properties': {
            'id': +way.id,
            'height': +way.osmBldPartHeight,
            'levels': +way.bldLevels,
            'color': getRGB(way.color),
            'type': 'buildingPart',
            'minHeight': +way.minHeight,
            'minLevel': +way.bldMinLevel,
            'name': way.name
        },
        'geometry': {
            'type': 'Polygon',
            'coordinates': [way.nodes]
        }
    };
}

function convert(options, onConvert) {
    var geoBlds = {};
    "use strict";
    var xmlStream = new expat.Parser('UTF-8');
    xmlStream.on('error', function(error) {
        console.error("error!", error);
    });
    var bounds;
    var blocks = [],
        geoBldParts = {},
        roofs = {},
        nodeMap = {},
        onWay = false,
        onRelation = false;
    var way = {};
    var relation = {};
    xmlStream.on('startElement', function(name, attrs) {
        if (name === 'bounds') {
            var tile = ((options && options.tile) ? options.tile : null);
            bounds = groundBlock(attrs, tile);
            blocks[blocks.length] = bounds;
        } else if (name === 'node') {
            var id = +attrs.id;
            var lat = attrs.lat;
            var lon = attrs.lon;
            nodeMap[+id] = [+lon, +lat];
        } else if (name === 'way') {
            way = {
                nodes: [],
                id: +attrs.id,
                isBld: false,
                minHeight: 0,
                bldMinLevel: 0
            }
            onWay = true;
        } else if (name === 'nd' && onWay) {
            if (!nodeMap.hasOwnProperty(attrs.ref)) {
                console.log("ERROR: Cannot link way to this node: " + attrs.ref);
            } else {
                way.nodes[way.nodes.length] = nodeMap[attrs.ref];
            }
        } else if (name === 'tag' && onWay) {
            switch (attrs.k) {
                case 'building':
                    way.isBld = true;
                    break;
                case 'building:levels':
                    way.bldLevels = +attrs.v;
                    break;
                case 'building:min_level':
                    way.bldMinLevel = +attrs.v;
                    break;
                case 'height':
                    way.osmBldPartHeight = +heightToMeter(attrs.v);
                    break;
                case 'min_height':
                    way.minHeight = +heightToMeter(attrs.v);
                    break;
                case 'name':
                    way.name = attrs.v;
                    break;
                case 'building:colour':
                    way.color = attrs.v;
                    break;
                case 'roof:shape':
                    way.roofShape = attrs.v;
                    break;
                case 'roof:height':
                    way.roofHeight = attrs.v;
                    break;
            }
        } else if (name === 'relation') {
            relation = {
                id: +attrs.id,
                isBld: false,
            };
            onRelation = true;
        } else if (onRelation && name === 'member' && attrs.type === 'way') {
            if (attrs.ref in geoBldParts) {
                var geoBld = getGeoBuilding(geoBlds, +relation.id);
                geoBld.features[geoBld.features.length] = geoBldParts[attrs.ref];
                if (roofs[attrs.ref] && options.loD > 1 && options.geoJsonExtended && options.geoJsonExtended == true) {
                    geoBld.features[geoBld.features.length] = roofs[attrs.ref];
                }
            }
        } else if (onRelation && name === 'tag') {
            switch (attrs.k) {
                case 'name':
                    relation.name = attrs.v;
                    break;
                case 'building:part':
                    relation.isBld = (attrs.v === 'yes');
                    break;
                case 'building':
                    relation.isBld = (attrs.v === 'yes');
                    break;
                case 'type':
                    relation.isBld = (attrs.v === 'building');
                    break;
                case 'height':
                    relation.osmBldPartHeight = heightToMeter(attrs.v);
                    break;
                case 'min_height':
                    relation.minHeight = heightToMeter(attrs.v);
                    break;
                case 'roof:shape':
                    relation.roofShape = attrs.v;
                    break;
                case 'roof:height':
                    relation.optRoofHeight = attrs.v;
                    break;
            };
        }
    });
    xmlStream.on('endElement', function(name) {
        if (name === 'way') {
            onWay = false;
            if (way.roofShape) {
                var roof = roofBlock(way);
            }
            var geoBldPart = geoBldPartBlock(way);
            if (way.isBld) {
                var geoBld = getGeoBuilding(geoBlds, +way.id);
                geoBld.features[geoBld.features.length] = geoBldPart;
                if (roof && options.loD > 1 && options.geoJsonExtended && options.geoJsonExtended == true) {
                    geoBld.features[geoBld.features.length] = roof;
                }
                if (turf.inside(turf.centroid(geoBld), bounds)) {
                    blocks[blocks.length] = JSON.parse(JSON.stringify(geoBld));
                }
            } else {
                geoBldParts[+way.id] = geoBldPart;
                if (roof) {
                    roofs[+way.id] = roof;
                }
            }
        } else if (name === 'relation') {
            // <tag k="type" v="building"/>
            if (!relation.isBld) {
                removeBuilding(geoBlds, +relation.id);
                log.debug("relation is not a building.");
            } else {
                log.debug("relation is a building.");
                var geoBld = getGeoBuilding(geoBlds, relation.id);
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
                if (turf.inside(turf.centroid(geoBld), bounds)) {
                    blocks[blocks.length] = JSON.parse(JSON.stringify(geoBld));
                }
            }
            onRelation = false;
        } else if (name === 'osm') {
            onConvert(blocks);
        }
    });
    return xmlStream;
}

exports.convert = convert;
