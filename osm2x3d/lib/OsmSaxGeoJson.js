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

var util = require('util');
var stream = require('stream');
var RGBColor = require('rgbcolor');
var sax = require("sax");
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


// function roofBlock(way) {
//     "use strict";
//     return {
//         "type": "Feature",
//         "properties": {
//             "id": +way.id,
//             "type": "roof",
//             "color": getRGB(way.color),
//             "roofShape": way.roofShape,
//             "height": way.osmBldPartHeight
//         },
//         "geometry": {
//             "type": "Polygon",
//             "coordinates": [way.nodes]
//         }
//     };
// }

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
            'name': way.name,
            'roof:shape': way.roofShape,
            // 'roof:height': way.osmBldPartHeight
            'roof:height': way.roofHeight,
            'roof:material': way.roofMaterial
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
    var xmlStream = sax.createStream(true);
    xmlStream.on('error', function(error) {
        console.error("error!", error);
        this._parser.error = null;
        this._parser.resume();
    });
    var bounds;
    var blocks = [],
        geoBldParts = {},
        // roofs = {},
        nodeMap = {},
        onWay = false,
        onRelation = false;
    var way = {};
    var relation = {};
    xmlStream.on('opentag', function(node) {
        var name = node.name,
            attrs = node.attributes;
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
                // if (roofs[attrs.ref] && options.loD > 1 && options.geoJsonExtended && options.geoJsonExtended == true) {
                //     geoBld.features[geoBld.features.length] = roofs[attrs.ref];
                // }
            }
        } else if (onRelation && name === 'tag') {
            switch (attrs.k) {
                case 'name':
                    relation.name = attrs.v;
                    break;
                case 'building:part':
                    relation.isBldPart = (attrs.v === 'yes');
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
    xmlStream.on('closetag', function(name) {
        if (name === 'way') {
            onWay = false;
            // if (way.roofShape) {
            //     var roof = roofBlock(way);
            // }
            var geoBldPart = geoBldPartBlock(way);
            if (way.isBld && !way.isBldPart) {
                var geoBld = getGeoBuilding(geoBlds, +way.id);
                geoBld.features[geoBld.features.length] = geoBldPart;
                // if (roof && options.loD > 1 && options.geoJsonExtended && options.geoJsonExtended == true) {
                //     geoBld.features[geoBld.features.length] = roof;
                // }
                // if (turf.inside(turf.centroid(geoBld), bounds)) {
                // geoBld: {
                //     "type": "FeatureCollection",
                //     "features": [{
                //         "type": "Feature",
                //         "properties": {
                //             "id": 249680748,
                //             "height": 30,
                //             "levels": 8,
                //             "color": "rgb(240,240,240)",
                //             "type": "buildingPart",
                //             "minHeight": 0,
                //             "minLevel": 0,
                //             "name": "Siège de l'UNESCO"
                //         },
                // if (geoBld.features[0].properties.id == "249680748") {
                if (turf.inside(turf.centroid(geoBld), bounds)) {
                    // if (way.isBldPart || turf.inside(turf.centroid(geoBld), bounds)) {
                    blocks[blocks.length] = JSON.parse(JSON.stringify(geoBld));
                    // }
                }
                //
                // }
                // console.log('In bounds!');
                // console.log('bounds:', JSON.stringify(bounds));
                // console.log('geoBld:', JSON.stringify(geoBld));
                // } else {
                //     console.log('Out of bounds!');
                //     console.log('bounds:', JSON.stringify(bounds));
                //     console.log('geoBld:', JSON.stringify(geoBld));
                // }
            } else {
                // if (turf.inside(turf.centroid(geoBldPart), bounds)) {

                geoBldParts[+way.id] = geoBldPart;

                // }
                // if (roof) {
                //     roofs[+way.id] = roof;
                // }
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
