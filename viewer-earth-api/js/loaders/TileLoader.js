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

var MAX_TEXTURE_REQUEST = 10;
OpenEarthView.TileLoader = function() {
    this.textureLoader = new THREE.TextureLoader();
    this.textureLoader.crossOrigin = '';
};

OpenEarthView.TileLoader.prototype = {

    constructor: OpenEarthView.TileLoader,
    textures: {},
    textureRequests: {},
    textureRequestsCount: 0,
    textureAliveRequests: {},
    textureAliveRequestsCount: 0,
    loadNextTile: function() {
        var scope = this;
        // textureLoader.crossOrigin: '';
        // console.log('textureAliveRequestsCount:', textureAliveRequestsCount, '/textureRequestsCount:', textureRequestsCount);
        var textures = scope.textures;
        var textureRequests = scope.textureRequests;
        var textureAliveRequests = scope.textureAliveRequests;
        while (scope.textureAliveRequestsCount < MAX_TEXTURE_REQUEST && scope.textureRequestsCount > 0) {
            var ids = Object.keys(textureRequests);
            var id = ids[ids.length - 1];
            scope.textureAliveRequestsCount = scope.textureAliveRequestsCount + (textureAliveRequests.hasOwnProperty(id) ? 0 : 1);
            textureAliveRequests[id] = textureRequests[id];
            var url = textureAliveRequests[id].url;
            delete textureRequests[id];
            scope.textureRequestsCount--;
            (function(url, id) {
                textureAliveRequests[id].request = scope.textureLoader.load(url,
                    function(texture) {
                        textures[id] = texture;
                        if (textureAliveRequests.hasOwnProperty(id)) {
                            textureAliveRequests[id].onLoaded(texture);
                            delete textureAliveRequests[id];
                            scope.textureAliveRequestsCount--;
                        }
                        scope.loadNextTile();
                    },
                    function() {},
                    function() {
                        if (textureAliveRequests.hasOwnProperty(id)) {
                            // textureAliveRequests[id].onLoaded(texture);
                            delete textureAliveRequests[id];
                            scope.textureAliveRequestsCount--;
                        }
                        scope.loadNextTile();
                    }
                );
            })(url, id);
        }
    },

    // var TILE_PROVIDER01 = '.tile.openstreetmap.org';
    // var TILE_PROVIDER01_RANDOM = ['a', 'b', 'c'];
    // var TILE_PROVIDER01_FILE_EXT = 'png';


    tileFactory: function(url, zoom, xtile, ytile, onLoaded, layerName) {
        var scope = this;
        var textures = scope.textures;
        var textureRequests = scope.textureRequests;
        var textureAliveRequests = scope.textureAliveRequests;
        var id = 'tile' + zoom + '_' + xtile + '_' + ytile + '_' + layerName;
        if (textures.hasOwnProperty(id)) {
            onLoaded(textures[id]);
        } else {
            scope.textureRequestsCount = scope.textureRequestsCount + (textureRequests.hasOwnProperty(id) ? 0 : 1);
            textureRequests[id] = {
                url: url,
                onLoaded: onLoaded
            }
            scope.loadNextTile();
        }
    },
    cancelOtherRequests: function(currentIds) {
        var scope = this;
        var textures = scope.textures;
        var textureRequests = scope.textureRequests;
        var textureAliveRequests = scope.textureAliveRequests;
        for (var id in textureRequests) {
            if (!currentIds.hasOwnProperty(id)) {
                delete textureRequests[id];
                scope.textureRequestsCount--;
            }
        }
        for (var id in textureAliveRequests) {
            if (!currentIds.hasOwnProperty(id)) {
                // if (textureAliveRequests[id].request.hasOwnProperty('abort')) {
                //     textureAliveRequests[id].request.abort();
                // }
                // delete textureAliveRequests[id];
                // textureAliveRequestsCount--;
            }
        }
        scope.loadNextTile();
    },

}
