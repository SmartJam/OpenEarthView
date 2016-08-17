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

log.setLevel("warn");

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
    return undefined;
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

function groundBlock(bound) {
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
    return bounds;
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
            'name': way.name,
            'roof:shape': way.roofShape,
            'roof:height': way.roofHeight,
            'roof:material': way.roofMaterial
        },
        'geometry': {
            'type': 'Polygon',
            'coordinates': [way.nodes]
        }
    };
}

var tiles = {};
var tilesData = {};

function convert(options, onConvert) {
    "use strict";
    if (options.logLevel !== undefined) {
        log.setLevel(options.logLevel);
    }
    var tileId = 'tile_' + options.zoom + '_' + options.xtile + '_' + options.ytile;
    log.info('tiles.hasOwnProperty(', tileId, '): ', tiles.hasOwnProperty(tileId));
    if (tiles.hasOwnProperty(tileId)) {
        log.info('tilesData[', tileId, '].full: ', tilesData[tileId].full);
    }
    if (tiles.hasOwnProperty(tileId) && tilesData[tileId].full) {
        onConvert(tiles[tileId]);
        return undefined;
    }

    var xmlStream = sax.createStream(true);
    xmlStream.on('error', function(error) {
        console.error("error!", error);
        this._parser.error = null;
        this._parser.resume();
    });
    // var bounds;
    // var geoBldParts = {};
    var geoBlds = {};
    var nodeMap = {};
    var onWay = false;
    var onRelation = false;
    var way = {};
    var relation = {};

    log.trace('tiles initialization...');
    log.trace('options.factor:', options.factor);
    // log.debug('options.factor:', options.factor);
    for (var factor_ = 0; factor_ <= +options.factor; factor_++) {
        // factor = 0 <-> zoom = 16
        // factor = 1 <-> zoom = 17
        // factor = 2 <-> zoom = 18
        // factor = 3 <-> zoom = 19
        var zoom_ = +options.zoom - +options.factor + factor_;
        log.trace('zoom_:', zoom_);
        // var xtileStart = (Math.floor((+options.xtile) / Math.pow(2, +options.factor - factor_)));
        var xtileStart = (Math.floor((+options.xtile) / Math.pow(2, +options.factor))) * Math.pow(2, factor_);
        var xtileStop = xtileStart + Math.pow(2, factor_);
        log.trace('xtileStart:', xtileStart);
        log.trace('xtileStop:', xtileStop);
        for (var xtile_ = xtileStart; xtile_ < xtileStop; xtile_++) {
            // log.debug('xtile_:', xtile_);
            // log.debug('ytile_:', Math.floor(+options.ytile / Math.pow(2, +options.factor - factor_)), ' -> ', Math.floor((+options.ytile + Math.pow(2, factor_)) / Math.pow(2, +options.factor - factor_)));
            // var ytileStart = (Math.floor((+options.ytile) / Math.pow(2, +options.factor - factor_)));
            var ytileStart = (Math.floor((+options.ytile) / Math.pow(2, +options.factor))) * Math.pow(2, factor_);
            var ytileStop = ytileStart + Math.pow(2, factor_);
            log.trace('ytileStar:', ytileStart);
            log.trace('ytileStop:', ytileStop);
            for (var ytile_ = ytileStart; ytile_ < ytileStop; ytile_++) {
                // log.debug('ytile_:', ytile_);
                var tileId_ = 'tile_' + zoom_ + '_' + xtile_ + '_' + ytile_;
                // log.trace('tileId_ (1):', tileId_);
                tilesData[tileId_] = {};
                tilesData[tileId_].full = false;
                tiles[tileId_] = [];
                tilesData[tileId_].geoBldParts = {};
                tiles[tileId_].push(groundBlock({
                    minlon: tile2long(+xtile_, +zoom_),
                    maxlon: tile2long(+xtile_ + 1, +zoom_),
                    minlat: tile2lat(+ytile_, +zoom_),
                    maxlat: tile2lat(+ytile_ + 1, +zoom_)
                }));
            }
        }
    }
    log.trace("tiles initialized");

    // var blocks = [];
    xmlStream.on('opentag', function(node) {
        var name = node.name,
            attrs = node.attributes;
        if (name === 'node') {
            var id = +attrs.id;
            var lat = attrs.lat;
            var lon = attrs.lon;
            nodeMap[+id] = [+lon, +lat];
        } else if (name === 'way') {
            // log.info('way - attrs: ', JSON.stringify(attrs));
            way = {
                nodes: [],
                id: +attrs.id,
                isBld: false,
                minHeight: 0,
                bldMinLevel: 0
            }
            onWay = true;
            if (way.id === 265417094) {
                log.info('Entering way.id: ', way.id);
            }
        } else if (name === 'nd' && onWay) {
            if (!nodeMap.hasOwnProperty(attrs.ref)) {
                console.log("ERROR: Cannot link way to this node: " + attrs.ref);
            } else {
                way.nodes.push(nodeMap[attrs.ref]);
            }
        } else if (name === 'tag' && onWay) {
            switch (attrs.k) {
                case 'building':
                    way.isBld = true;
                    break;
                case 'building:levels':
                    way.isBld = true;
                    way.bldLevels = +attrs.v;
                    break;
                case 'building:min_level':
                    way.isBld = true;
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
                    way.isBld = true;
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
            // } else if (onRelation && name === 'member' && attrs.type === 'way') {
            //     if (attrs.ref in geoBldParts) {
            //         var geoBld = getGeoBuilding(geoBlds, +relation.id);
            //         geoBld.features[geoBld.features.length] = geoBldParts[attrs.ref];
            //     }
        } else if (onRelation && name === 'tag') {
            switch (attrs.k) {
                case 'name':
                    relation.name = attrs.v;
                    break;
                case 'building:part':
                    log.trace('relation ' + relation.id + ' is a buildingPart');
                    relation.isBldPart = true;
                    relation.isBld = true;
                    break;
                case 'building':
                    relation.isBld = true;
                    log.trace('relation ' + relation.id + ' is a building');
                    log.trace('relation:' + JSON.stringify(relation));
                    break;
                case 'type':
                    relation.isBld = (attrs.v === 'building') ? true : relation.isBld;
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
            if (way.id === 265417094) {
                // if (way.id === '265417094') {
                log.info('Leaving way.id: ', way.id);
            }
            onWay = false;
            var geoBldPart = geoBldPartBlock(way);
            if (way.isBld) {
                var geoBld = getGeoBuilding(geoBlds, +way.id);
                geoBld.features.push(geoBldPart);
                // turf.centroid(geoBld): {"type":"Feature","geometry":{"type":"Point","coordinates":[-73.98062250000001,40.74985525]},"properties":{}}
                var centroid = {
                    geojson: turf.centroid(geoBld)
                };
                centroid.lon = centroid.geojson.geometry.coordinates[0];
                centroid.lat = centroid.geojson.geometry.coordinates[1];

                for (var zoom_ = +options.zoom - +options.factor; zoom_ <= +options.zoom; zoom_++) {
                    var tileId_ = 'tile_' + zoom_ +
                        '_' + long2tile(centroid.lon, zoom_) +
                        '_' + lat2tile(centroid.lat, zoom_);
                    if (tiles.hasOwnProperty(tileId_)) {
                        tiles[tileId_].push(JSON.parse(JSON.stringify(geoBld)));
                        // if (tileId_ === 'tile_19_154404_197057') {
                        //     log.info('Building added to: ' + tileId_);
                        // }
                    }
                }
                // if (turf.inside(turf.centroid(geoBld), bounds)) {
                //     log.debug('building ' + way.id + ' is inside bounds.');
                //
                //     blocks[blocks.length] = JSON.parse(JSON.stringify(geoBld));
                // } else {
                //     log.debug('building ' + way.id + ' is not inside bounds.');
                // }
            } else {
                var centroid = {
                    geojson: turf.centroid(geoBldPart)
                };
                centroid.lon = centroid.geojson.geometry.coordinates[0];
                centroid.lat = centroid.geojson.geometry.coordinates[1];
                for (var zoom_ = +options.zoom - +options.factor; zoom_ <= +options.zoom; zoom_++) {
                    var tileId_ = 'tile_' + zoom_ +
                        '_' + long2tile(centroid.lon, zoom_) +
                        '_' + lat2tile(centroid.lat, zoom_);
                    // log.debug('tileId_ (0):', tileId_);
                    if (tiles.hasOwnProperty(tileId_)) {
                        tilesData[tileId_].geoBldParts[+way.id] = geoBldPart;
                        // if (tileId_ === 'tile_19_154404_197057') {
                        //     log.info('Way added to : ' + tileId_);
                        // }
                    }
                }
                // if (turf.inside(turf.centroid(geoBldPart), bounds)) {
                //     log.debug('way ' + way.id + ' is inside bounds.');
                //     geoBldParts[+way.id] = geoBldPart;
                // } else {
                //     log.debug('way ' + way.id + ' is not inside bounds.');
                // }
            }
        } else if (name === 'relation') {
            log.trace('relation:' + JSON.stringify(relation));
            if (!relation.isBld) {
                removeBuilding(geoBlds, +relation.id);
                log.trace('relation ' + relation.id + ' is not a building.');
            } else {
                log.trace('relation ' + relation.id + ' is a building.');
                var geoBld = getGeoBuilding(geoBlds, relation.id);
                relation.osmBldPartHeight = (relation.osmBldPartHeight !== undefined) ? relation.osmBldPartHeight : 10;
                geoBld.properties.name = relation.name;
                for (var i = 0; i < geoBld.features.length; i++) {
                    var geoBldPart = geoBld.features[i];
                    if (geoBldPart.properties.height === undefined) {
                        geoBldPart.properties.height = relation.osmBldPartHeight;
                    }
                    if (geoBldPart.properties.minHeight === undefined) {
                        geoBldPart.properties.minHeight = relation.minHeight;
                    }
                }

                for (var factor_ = 0; factor_ <= +options.factor; factor_++) {
                    var zoom_ = +options.zoom - +options.factor + factor_;
                    // var xtileStart = (Math.floor((+options.xtile) / Math.pow(2, +options.factor - factor_)));
                    var xtileStart = (Math.floor((+options.xtile) / Math.pow(2, +options.factor))) * Math.pow(2, factor_);
                    var xtileStop = xtileStart + Math.pow(2, factor_);
                    log.info('Zoom ', zoom_, ' - xtile from ', xtileStart, ' to ', xtileStop);
                    var ytileStart = (Math.floor((+options.ytile) / Math.pow(2, +options.factor))) * Math.pow(2, factor_);
                    var ytileStop = ytileStart + Math.pow(2, factor_);
                    log.info('zoom', zoom_, ' - ytile from ', ytileStart, ' to ', ytileStop);
                    for (var xtile_ = xtileStart; xtile_ < xtileStop; xtile_++) {
                        for (var ytile_ = ytileStart; ytile_ < ytileStop; ytile_++) {
                            var tileId_ = 'tile_' + zoom_ + '_' + xtile_ + '_' + ytile_;
                            tiles[tileId_].push(JSON.parse(JSON.stringify(geoBld)));
                            if (tileId_ === 'tile_19_154404_197057') {
                                log.info('Relation added to: ' + tileId_);
                            }
                        }
                    }
                }
            }
            onRelation = false;
        } else if (name === 'osm') {
            for (var factor_ = 0; factor_ <= +options.factor; factor_++) {
                var zoom_ = +options.zoom - +options.factor + factor_;
                // var xtileStart = (Math.floor((+options.xtile) / Math.pow(2, +options.factor - factor_)));
                var xtileStart = (Math.floor((+options.xtile) / Math.pow(2, +options.factor))) * Math.pow(2, factor_);
                var xtileStop = xtileStart + Math.pow(2, factor_);
                for (var xtile_ = xtileStart; xtile_ < xtileStop; xtile_++) {
                    // var ytileStart = (Math.floor((+options.ytile) / Math.pow(2, +options.factor - factor_)));
                    var ytileStart = (Math.floor((+options.ytile) / Math.pow(2, +options.factor))) * Math.pow(2, factor_);
                    var ytileStop = ytileStart + Math.pow(2, factor_);
                    for (var ytile_ = ytileStart; ytile_ < ytileStop; ytile_++) {
                        var tileId_ = 'tile_' + zoom_ + '_' + xtile_ + '_' + ytile_;
                        // if (tileId_ === 'tile_19_154404_197057') {
                        //     log.info('Block built about ' + tileId_ + ' : ', JSON.stringify(tiles[tileId_]));
                        // }
                        tilesData[tileId_].full = true;
                    }
                }
            }
            onConvert(tiles[tileId]);
            // delete tiles[tileId];
        }
    });
    return xmlStream;
}
var long2tile = function(lon, zoom) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
}
var lat2tile = function(lat, zoom) {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
}
var tile2long = function(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
}
var tile2lat = function(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

function setLogLevel(logLevel) {
    log.setLevel(logLevel);
}

exports.convert = convert;
