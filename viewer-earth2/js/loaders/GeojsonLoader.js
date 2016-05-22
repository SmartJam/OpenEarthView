/**
Open Earth View - viewer-threejs
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

* @author Clement Igonet
*/

THREE.GeojsonLoader = function(manager) {

    this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;

};

THREE.GeojsonLoader.prototype = {

    constructor: THREE.GeojsonLoader,
    crossOrigin: undefined,

    load: function(url, onLoad, onProgress, onError) {
        var scope = this;
        var loader = new THREE.XHRLoader(scope.manager);
        loader.load(url, function(text) {
            // console.log('loaded:', text);
            onLoad(scope.parse(JSON.parse(text)));
            // onLoad(text);
        }, onProgress, onError);
    },

    setCrossOrigin: function(value) {

        this.crossOrigin = value;

    },

    parse: function(json) {
        var myTest = [{
            "type": "Feature",
            "properties": {
                "type": "bounds",
                "tile": "http://a.tile.openstreetmap.org/19/265545/180361.png"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [2.3352814, 48.8601975],
                        [2.335968, 48.8601975],
                        [2.335968, 48.8606493],
                        [2.3352814, 48.8606493]
                    ]
                ]
            }
        }, {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {
                    "id": 53815259,
                    "height": 5,
                    "levels": null,
                    "color": "rgb(240,240,240)",
                    "type": "buildingPart",
                    "minHeight": 0,
                    "minLevel": 0,
                    "roof:shape": "pyramidal",
                    "roof:height": "5"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [2.3357061, 48.8606057],
                            [2.335607, 48.8605766],
                            [2.335563, 48.8606414],
                            [2.3356622, 48.8606705],
                            [2.3357061, 48.8606057]
                        ]
                    ]
                }
            }],
            "properties": {
                "id": 53815259,
                "type": "building"
            }
        }];
        return json;
    },

    parseMaterials: function(json) {
        var materials = {};
        return materials;
    },

    parseGeometry: function(json) {
        var geometry = new THREE.BufferGeometry();
        return geometry;
    },

    parseObjects: function(json, materials) {
        var scene = new THREE.Scene();
        return scene;
    }
};
