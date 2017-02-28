/**
Open Earth View - library
The MIT License (MIT)
Copyright (c) 2017 Clément Igonet

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

* @author Clement Igonet
*/

var toolbox = OpenEarthView.toolbox;
var RequestManager = OpenEarthView.RequestManager;
// OpenEarthView.Layer.OverpassBuilding = function(name, urls, options) {
OpenEarthView.Layer.OverpassBuilding = function(name, urls, options) {
    this.name = (name !== undefined) ? name : 'Overpass';
    this.minZoom = 17;
    if (options !== undefined) {
        this.minZoom = (options.minZoom !== undefined) ? options.minZoom : 18;
        this.localData = (options.localData !== undefined) ? options.localData : undefined;
        // console.log('minZoom: ' + this.minZoom);
    }
    // if (OpenEarthViewLayers.hasOwnProperty(name)) {
    //     console.err('Cannot register this already existing layer !');
    //     return;
    // }
    this.urls = (urls !== undefined) ? urls : [
        'http://overpass-api.de/api/interpreter'
    ];
};

// OpenEarthView.Layer.OverpassBuilding.prototype = {
OpenEarthView.Layer.OverpassBuilding.prototype = {
    constructor: OpenEarthView.Layer.OverpassBuilding,
    type: 'building',
    getName: function() {
        return this.name
    },
    getLocalUrl(zoom, xtile, ytile) {
        return this.localData
            .replace('${z}', zoom)
            .replace('${x}', xtile)
            .replace('${y}', ytile);
    },
    getUrl: function(zoom, xtile, ytile) {
        let scope = this;
        // let urls = OpenEarthViewLayers[scope.name];
        let urlRandom = this.urls[
            Math.floor(Math.random() * this.urls.length)];

        // Process GPS bounds
        minLon = toolbox.tile2long(xtile, zoom);
        maxLon = toolbox.tile2long(xtile + 1, zoom);
        minLat = toolbox.tile2lat(ytile + 1, zoom);
        maxLat = toolbox.tile2lat(ytile, zoom);

        return urlRandom
            .replace(/\${tile2long\(x\)}/g, minLon)
            .replace(/\${tile2long\(x\+1\)}/g, maxLon)
            .replace(/\${tile2lat\(y\+1\)}/g, minLat)
            .replace(/\${tile2lat\(y\)}/g, maxLat);
    }
}

// var overpassJsonLoaderSingleton;
//
// THREE.OverpassJsonLoader = function() {
//     if (overpassJsonLoaderSingleton === undefined) {
//         overpassJsonLoaderSingleton = this;
//     }
// };
//
// THREE.OverpassJsonLoader.getSingleton = function() {
//     if (overpassJsonLoaderSingleton === undefined) {
//         overpassJsonLoaderSingleton = new THREE.OverpassJsonLoader();
//     }
//     return overpassJsonLoaderSingleton;
// }

var R = 6378.137;

// var overpassJsons = {};
// var overpassJsonRequests = {};
// var overpassJsonAliveRequests = {};
// var overpassJsonAliveRequestsCount = 0;
// var overpassJsonRequestsCount = 0;

// THREE.OverpassJsonLoader.prototype = {
//
//     constructor: THREE.OverpassJsonLoader,
//     crossOrigin: undefined,
//     requestManager: new RequestManager(
//         new THREE.FileLoader(THREE.DefaultLoadingManager),
//         RequestManager.DEFAULT_MAX_REQUEST),
//     load: function(tileId, url, onLoad, lod, defaultColor) {
//         this.requestManager.newRequest(tileId, url, onLoad, THREE.OverpassJsonLoader.parse);
//     },
//     setCrossOrigin: function(value) {
//         this.crossOrigin = value;
//     }
// };

var OverpassJsonLoaderSingleton;

THREE.OverpassJsonLoader = class {
    constructor() {
        this.crossOrigin = undefined;
        this.requestManager = new RequestManager(
            new THREE.FileLoader(),
            new THREE.FileLoader(THREE.DefaultLoadingManager),
            THREE.OverpassJsonLoader.MAX_OVERPASS_JSON_REQUEST);
        // console.log('this.requestManager:', this.requestManager);
    }
    static getSingleton() {
        if (OverpassJsonLoaderSingleton === undefined) {
            OverpassJsonLoaderSingleton = new THREE.OverpassJsonLoader();
        }
        // console.log('THREE.OverpassJsonLoader.singleton:', OverpassJsonLoaderSingleton);
        return OverpassJsonLoaderSingleton;
    }
    load(tileId, localUrl, url, onLoad, lod, defaultColor) {
        // console.log('this:', this);
        // console.log('this.requestManager:', this.requestManager);
        this.requestManager.newRequest(tileId, localUrl, url, onLoad, THREE.OverpassJsonLoader.parse);
    }
    setCrossOrigin(value) {
        this.crossOrigin = value;
    }
};

THREE.OverpassJsonLoader.singleton = undefined;
// THREE.OverpassJsonLoader.MAX_OVERPASS_JSON_REQUEST = 20;
THREE.OverpassJsonLoader.MAX_OVERPASS_JSON_REQUEST = 20;

THREE.OverpassJsonLoader.parse = function(json, tileId) {
    // console.log('', tileId, ':', JSON.stringify(json));
    // let scope = this;
    let measure = OpenEarthView.toolbox.measure;
    let tile2long = OpenEarthView.toolbox.tile2long;
    let tile2lat = OpenEarthView.toolbox.tile2lat;
    // let lonOri, latOri;
    let tile = new THREE.Object3D();
    let overpassJson = json;
    let bounds = {
            minLon: tile2long(tileId.x, tileId.z),
            maxLon: tile2long(tileId.x + 1, tileId.z),
            minLat: tile2lat(tileId.y + 1, tileId.z),
            maxLat: tile2lat(tileId.y, tileId.z)
        }
        // console.log('bounds:', JSON.stringify(bounds));
    let lonOri = bounds.minLon;
    let latOri = bounds.maxLat;
    let nodes = {};
    let buildings = {};
    let buildingBlocks = [];
    let buildingParts = {};
    // TODO: deal with empty data ( {} )
    let elements = (overpassJson.hasOwnProperty('elements')) ? overpassJson.elements : [];
    for (let eltIdx = 0; eltIdx < elements.length; eltIdx++) {
        let element = elements[eltIdx];
        // console.log('element.type:', element.type);
        // console.log('element:', element);
        switch (element.type) {
            case 'node':
                nodes[element.id] = element;
                break;
            case 'way':
                // building inbound
                if (element.hasOwnProperty('tags') && element.tags.hasOwnProperty('building') && element.tags.building !== 'no') {
                    if (bounds.minLon > element.center.lon || element.center.lon > bounds.maxLon ||
                        bounds.minLat > element.center.lat || element.center.lat > bounds.maxLat) {
                        // break;
                    } else {
                        // console.log('Add as building:', element);
                        buildings[element.id] = {};
                        buildings[element.id].info = element;
                        buildings[element.id].blocks = [element];
                    }
                } else
                // building part
                if (element.hasOwnProperty('tags') && element.tags.hasOwnProperty('building:part') && element.tags['building:part'] !== 'no') {
                    buildingParts[element.id] = element;
                    // console.log('buildingParts[', element.id, ']:', element);
                }

                break;
            case 'relation':
                // console.log('relation:', element);
                if (bounds.minLon > element.center.lon || element.center.lon > bounds.maxLon ||
                    bounds.minLat > element.center.lat || element.center.lat > bounds.maxLat) {
                    break;
                }
                let relation = element;
                if (relation.id === 2098969) {
                    console.log('Empire State Building !')
                }
                // console.log('relation.tags:', relation.tags);
                if (relation.hasOwnProperty('tags') && relation.tags.hasOwnProperty('type') && relation.tags.type === 'building') {
                    // console.log('relation is building !');
                    if (bounds.minLon > relation.center.lon || relation.center.lon > bounds.maxLon ||
                        bounds.minLat > relation.center.lat || relation.center.lat > bounds.maxLat) {
                        // console.log("relation out of bounds.");
                        break;
                    }
                    // console.log("Yes! Relation in bounds !");
                    // console.log(JSON.stringify(relation));
                    let buildingBlocks = [];
                    buildings[relation.id] = {};
                    buildings[relation.id].info = relation;
                    // buildings[relation.id].blocks = [];
                    // console.log('relation.members.length:', relation.members.length);
                    for (let memberIdx = 0; memberIdx < relation.members.length; memberIdx++) {
                        let member = relation.members[memberIdx];
                        // console.log('relation.members[', memberIdx, ']:', relation.members[memberIdx]);

                        if (member.type === 'way' && buildingParts.hasOwnProperty(member.ref)) {
                            buildingBlocks.push(buildingParts[member.ref]);
                            // buildings.push(buildingParts[member.ref]);
                        }
                    }
                    if (buildingBlocks.length > 0) {
                        // console.log('buildingBlocks:', buildingBlocks);
                        // buildings.push(buildingBlocks);
                        buildings[relation.id].blocks = buildingBlocks;
                    }
                }
                break;
        }
    }
    // Process data here
    // console.log('buildings.length:', buildings.length);
    // Parse all buildings
    for (bldKey in buildings) {
        // for (let bldIdx = 0; bldIdx < buildings.length; bldIdx++) {
        // let building = buildings[bldIdx];
        let building = buildings[bldKey];
        // console.log('building:', building);
        let buildingMesh = new THREE.Object3D();
        // console.log('-building.info:', building.info);
        buildingMesh.userData = {
            osm: building.info
        };
        let failbackColor = Math.random() * 65536 +
            Math.random() * 256 +
            Math.random();

        // To filter simple buildings (as a way, not a relation):
        // if (building.length < 2) {
        //     continue;
        // }
		if (!building.hasOwnProperty('blocks')) {
			continue;
		}
        // console.log('building.blocks.length:', building.blocks.length);
        for (let bldBlockIdx = 0; bldBlockIdx < building.blocks.length; bldBlockIdx++) {
            let buildingBlock = building.blocks[bldBlockIdx];
            // console.log('buildingBlock:', buildingBlock);

            if (bounds.minLon > buildingBlock.center.lon || buildingBlock.center.lon > bounds.maxLon ||
                bounds.minLat > buildingBlock.center.lat || buildingBlock.center.lat > bounds.maxLat) {
                break;
            }

            // console.log('processing building block:', buildingBlock.tags);
            let minHeight = (buildingBlock.tags.hasOwnProperty('minHeight')) ?
                buildingBlock.tags.minHeight : 0;
            let roofHeight = (buildingBlock.tags.hasOwnProperty('roof:height')) ?
                buildingBlock.tags['roof:height'] : 0;
            let height = (buildingBlock.tags.hasOwnProperty('height') && buildingBlock.tags.height != null) ?
                (buildingBlock.tags.height - roofHeight) : 20;
            let color = (buildingBlock.tags.hasOwnProperty('color')) ?
                buildingBlock.tags.color : failbackColor;

            let levels = (buildingBlock.tags.hasOwnProperty('buildingBlock:levels')) ?
                buildingBlock.tags['buildingBlock:levels'] : 1;
            // building:levels
            if (buildingBlock.nodes.length <= 2) {
                break;
            }
            // for (let level = 0; level < levels; level++) {
            let shapePts = [];
            for (let nodeIdx = 0; nodeIdx < buildingBlock.nodes.length; nodeIdx++) {
                let lon = nodes[buildingBlock.nodes[nodeIdx]].lon;
                let lat = nodes[buildingBlock.nodes[nodeIdx]].lat;
                let x = ((lon - lonOri) / Math.abs(lonOri - lon)) * measure(latOri, lonOri, latOri, lon);
                let y = ((lat - latOri) / Math.abs(latOri - lat)) * measure(latOri, lonOri, lat, lonOri);
                shapePts.push(new THREE.Vector2(x, y));
            }
            let shape = new THREE.Shape(shapePts);
            let extrudeSettings = {
                amount: height,
                bevelEnabled: false,
                bevelSegments: 1,
                steps: 1,
                bevelSize: 2,
                bevelThickness: 1
            };
            let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

            let material = new THREE.MeshPhongMaterial({
                color: color,
                transparent: false,
                opacity: 0.4
            });
            // let material = new THREE.MeshPhongMaterial({
            //     color: color,
            //     transparent: false,
            //     opacity: Math.random()
            // });
            if (tileId.lod == 4) {
                material.transparent = true;
            }

            let buildingBlockMesh = new THREE.Mesh(geometry, material);
            buildingBlockMesh.userData = {
                osm: buildingBlock
            };

            buildingBlockMesh.position.z = minHeight;
            buildingMesh.add(buildingBlockMesh);
            OpenEarthView.toolbox.singleton.assignUVs(geometry);
            // }
        }
        // console.log('buildingMesh.userData:', buildingMesh.userData);
        tile.add(buildingMesh);
    }
    return tile;
    // }
}
