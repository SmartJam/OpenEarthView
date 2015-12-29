/* global require */

// The rest of the code

//var OsmGround = require('./OsmGround');
// info: https://www.npmjs.com/package/geolib
var util = require('util');
var stream = require('stream');
var RGBColor = require('rgbcolor');
var sax = require("sax");

function getRGB(osmColor) {
//    console.log("osmColor: " + osmColor);
//    #9D9E99
    if (osmColor) {
        var hexRGB = /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/i.exec(osmColor);
//        console.log("hexRGB: " + JSON.stringify(hexRGB));
        if (hexRGB) {
            return "rgb("
                    + (parseInt(hexRGB[1], 16)) + ","
                    + (parseInt(hexRGB[2], 16)) + ","
                    + (parseInt(hexRGB[3], 16)) + ")";
        }
//        console.log("osmColor: " + osmColor);
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

//function getGeoBound(bounds) {
//    "use strict";
//    return {
//        "type": "Feature",
//        "bbox": [bounds.minlon, bounds.minlat, bounds.maxlon, bounds.maxlat],
//        "geometry": {
//            "type": "Polygon",
//            "coordinates": [[
//                    [bounds.minlon, bounds.minlat],
//                    [bounds.maxlon, bounds.minlat],
//                    [bounds.maxlon, bounds.maxlat],
//                    [bounds.minlon, bounds.maxlat]
//                ]]
//        },
//        properties: {
//            "type": "bounds"
//        }
//    }
//}

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
    var saxStream = sax.createStream(true);
    saxStream.on("error", function (e) {
        console.error("error!", e);
        this._parser.error = null;
        this._parser.resume();
    });
    var blocks = [],
            expat = require('node-expat'),
            parser = new expat.Parser('UTF-8'),
            geoBldParts = {},
            geoRoofs = {},
            nodeMap = {},
            onWay = false,
            onRelation = false;
    var way = {};
    var relation = {};
    saxStream.on("opentag", function (node) {
//    parser.on('startElement', function (name, attrs) {
        if (node.name === 'node') {
//            console.log("node: " + JSON.stringify(node));
            var id = node.attributes.id;
            var lat = node.attributes.lat;
            var lon = node.attributes.lon;
            nodeMap[id] = [+lon, +lat];
//            console.log(id + ":" + JSON.stringify(nodeMap[id]));
        } else if (node.name === 'way') {

            way.nodes = [];
            way.id = node.attributes.id;
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
        } else if (node.name === 'nd' && onWay) {
            if (!nodeMap.hasOwnProperty(node.attributes.ref)) {
                console.log("ERROR: Cannot link way to this node: " + node.attributes.ref);
            } else {
                way.nodes[way.nodes.length] = nodeMap[node.attributes.ref];
            }
        } else if (node.name === 'tag' && onWay) {
            if (node.attributes.k === 'building') {
                way.isBld = true;
            } else if (node.attributes.k === 'building:levels') {
                way.bldLevels = node.attributes.v;
            } else if (node.attributes.k === 'building:min_level') {
                way.bldMinLevel = node.attributes.V;
            } else if (node.attributes.k === 'height') {
                way.osmBldPartHeight = heightToMeter(node.attributes.v);
            } else if (node.attributes.k === 'min_height') {
                way.minHeight = heightToMeter(node.attributes.v);
            } else if (node.attributes.k === 'name') {
                way.name = node.attributes.v;
            } else if (node.attributes.k === 'building:colour') {
                way.color = node.attributes.v;
            } else if (node.attributes.k === 'roof:shape') {
                way.roofShape = node.attributes.v;
            } else if (node.attributes.k === 'roof:height') {
                way.roofHeight = node.attributes.v;
            }
//    console.log(name, attrs)
        } else if (node.name === 'relation') {
            relation.id = node.attributes.id;
            relation.isBld = false;
            relation.osmBldPartHeight = undefined;
            relation.minHeight = undefined;
            relation.name = undefined;
            relation.pptRoofHeight = undefined;
            relation.roofShape = 'flat';
            onRelation = true;
        } else if (onRelation && node.name === 'member' && node.attributes.type === 'way') {
//            console.log("osmBldParts: " + JSON.stringify(osmBldParts));
            if (node.attributes.ref in geoBldParts) {
                var geoBld = getGeoBuilding(relation.id);
//                console.log("osmBld: " + JSON.stringify(osmBld));
                geoBld.features[geoBld.features.length] = geoBldParts[node.attributes.ref];
                if (geoRoofs[node.attributes.ref]) {
                    geoBld.features[geoBld.features.length] = geoRoofs[node.attributes.ref];
                }
            }
        } else if (onRelation && node.name === 'tag' && node.attributes.k === 'name') {
            relation.name = node.attributes.v;
        } else if (onRelation && node.name === 'tag' && node.attributes.k === 'building:part' && node.attributes.v === 'yes') {
            relation.isBld = true;
        } else if (onRelation && node.name === 'tag' && node.attributes.k === 'building' && node.attributes.v === 'yes') {
            relation.isBld = true;
        } else if (onRelation && node.name === 'tag' && node.attributes.k === 'type' && node.attributes.v === 'building') {
            relation.isBld = true;
        } else if (onRelation && node.name === 'tag' && node.attributes.k === 'height') {
            relation.osmBldPartHeight = heightToMeter(node.attributes.v);
        } else if (onRelation && node.name === 'tag' && node.attributes.k === 'min_height') {
            relation.minHeight = heightToMeter(node.attributes.v);
        } else if (onRelation && node.name === 'tag' && node.attributes.k === 'roof:shape') {
            relation.roofShape = node.attributes.v;
        } else if (onRelation && node.name === 'tag' && node.attributes.k === 'roof:height') {
            relation.optRoofHeight = node.attributes.v;
        }
    });
    saxStream.on("closetag", function (node) {
//        console.log("node: " + JSON.stringify(node));
//    parser.on('endElement', function (name) {
//        console.log("coucou");
        if (node === 'way') {
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
//            console.log("geoBldPart");
            if (way.isBld) {
                var geoBld = getGeoBuilding(way.id);
                geoBld.features[geoBld.features.length] = geoBldPart;
                if (geoRoof) {
                    geoBld.features[geoBld.features.length] = geoRoof;
                }
                blocks[blocks.length] = JSON.parse(JSON.stringify(geoBld));
//                console.log(JSON.stringify(geoBld));
//                console.log(JSON.stringify(geoBld));
//                if (onBlock !== undefined) {
//                    onBlock(geoBld);
//                }
//                if (geoJsonOutputStream !== undefined) {
//                    geoJsonOutputStream.write(JSON.stringify(geoBld));
//                }
//                if (!osmInputStream && !geoJsonOutputStream) {
//                }
            } else {
                geoBldParts[way.id] = geoBldPart;
                if (geoRoof) {
                    geoRoofs[way.id] = geoRoof;
                }
//                console.log("osmBldParts[" + way.id + "]: " + JSON.stringify(osmBldPart));
            }
        } else if (node === 'relation') {
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
//                console.log(JSON.stringify(geoBld));
//                if (onBlock !== undefined) {
//                    onBlock(geoBld);
//                }
//                if (geoJsonOutputStream !== undefined) {
//                    geoJsonOutputStream.write(JSON.stringify(geoBld));
//                }


//                if (!osmInputStream && !geoJsonOutputStream) {
//                }
            }
//            console.log('relation: ' + JSON.stringify(relation));
            onRelation = false;
        } else if (node === 'osm') {
//            console.log("node: " + JSON.stringify(node));

            if (onConvert !== undefined) {
                onConvert(blocks);
            }
//            console.log("osmBlds: " + JSON.stringify(osmBlds, null, 2));
//            if (geoJsonOutputStream !== undefined) {
//                geoJsonOutputStream.end();
//            }
        }
//    console.log(name)
    });
//    parser.on('text', function (text) {
////        console.log(text)
//    });
//    parser.on('error', function (error) {
////        console.error(error)
//    });
//    var readline = require('readline');
//    var rl = readline.createInterface({
//        input: process.stdin
//    });
//    rl.on('line', function (block) {
//        parser.write(block);
//    });
//    return rl;
    return saxStream;
}


// Functions which will be available to external callers
exports.convert = convert;



//var stream = require('stream');
//var util = require('util');
//
//function EchoStream () { // step 2
//  stream.Writable.call(this);
//};
//util.inherits(EchoStream, stream.Writable); // step 1
//EchoStream.prototype._write = function (chunk, encoding, done) { // step 3
//  console.log(chunk.toString());
//  done();
//}
//
//var myStream = new EchoStream(); // instanciate your brand new stream
//process.stdin.pipe(myStream);


//function createWriteStream(onConvert) {
//    var converter = convert(onConvert);
//    var ws = new stream.Writable();
//    ws._write = function (chunk, encoding, done) {
////        console.log("chunk.toString(): " + chunk.toString())
//        converter.write(chunk.toString());
//        done();
//    };
//    return ws;
//}

//function createWriteStream() { // step 2
//    createWriteStream.Writable.call(this);
//    var converter;
//}
//createWriteStream.prototype.init = function (onConvert) { // step 3
//    converter = convert(onConvert); ;
//}
//util.inherits(createWriteStream, stream.Writable); // step 1
//createWriteStream.prototype._write = function (chunk, encoding, done) { // step 3
//    this.converter.write(chunk.toString());
//    done();
//}
//
//
//
//exports.createWriteStream = createWriteStream;


//var writable = new stream.Writable({
//    init: function(onConvert) {
//        
//    };
//    write: function (chunk, encoding, next) {
//        console.log(chunk.toString());
//        next();
//    }
//});