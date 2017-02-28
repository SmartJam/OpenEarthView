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

// OpenEarthView.TileLoader = function() {
//     this.textureLoader = new THREE.TextureLoader();
//     this.textureLoader.crossOrigin = '';
//     // this.textureLoader
// };
var THREE = require('THREE');

class TileLoader {
    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.textureLoader.crossOrigin = '';
        this.textures = {};
        this.textureRequests = {};
        this.textureRequestsCount = 0;
        this.textureAliveRequests = {};
        this.textureAliveRequestsCount = 0;
    }

    loadNextTile() {
        // let scope = this;
        // textureLoader.crossOrigin: '';
        // console.log('textureAliveRequestsCount:', textureAliveRequestsCount, '/textureRequestsCount:', textureRequestsCount);
        let textures = this.textures;
        let textureRequests = this.textureRequests;
        let textureAliveRequests = this.textureAliveRequests;
        // console.log('scope.textureAliveRequestsCount: ', scope.textureAliveRequestsCount);
        // console.log('scope.textureRequestsCount: ', scope.textureRequestsCount);
        while (this.textureAliveRequestsCount < TileLoader.MAX_TEXTURE_REQUEST && this.textureRequestsCount > 0) {
            let ids = Object.keys(textureRequests);
            let id = ids[ids.length - 1];
            this.textureAliveRequestsCount = this.textureAliveRequestsCount + (textureAliveRequests.hasOwnProperty(id) ? 0 : 1);
            textureAliveRequests[id] = textureRequests[id];
            let url = textureAliveRequests[id].url;
            delete textureRequests[id];
            this.textureRequestsCount--;
            // console.log('(2) scope.textureAliveRequestsCount: ', scope.textureAliveRequestsCount);
            // console.log('(2) scope.textureRequestsCount: ', scope.textureRequestsCount);
            let scope = this;
            (function(url, id) {
                // console.log('Asking for loading: ', url);
                // zoom =

                textureAliveRequests[id].request = scope.textureLoader.load(url,
                    function(texture) {
                        textures[id] = texture;
                        if (textureAliveRequests.hasOwnProperty(id)) {
                            textureAliveRequests[id].onLoaded(texture);
                            delete textureAliveRequests[id];
                            scope.textureAliveRequestsCount--;
                            // console.log('(0) scope.textureAliveRequestsCount: ', scope.textureAliveRequestsCount);
                            // console.log('(0) scope.textureRequestsCount: ', scope.textureRequestsCount);
                        }
                        scope.loadNextTile();
                    },
                    function() {},
                    function() {
                        if (textureAliveRequests.hasOwnProperty(id)) {
                            // textureAliveRequests[id].onLoaded(texture);
                            delete textureAliveRequests[id];
                            scope.textureAliveRequestsCount--;
                            // console.log('scope.textureAliveRequestsCount: ', scope.textureAliveRequestsCount);
                            // console.log('scope.textureRequestsCount: ', scope.textureRequestsCount);
                        }
                        scope.loadNextTile();
                    }
                );
            })(url, id);
        }
    };

    // var TILE_PROVIDER01 = '.tile.openstreetmap.org';
    // var TILE_PROVIDER01_RANDOM = ['a', 'b', 'c'];
    // var TILE_PROVIDER01_FILE_EXT = 'png';

    tilePreload(zoom, xtile, ytile, onLoaded) {
        let textures = this.textures;
        // let textureRequests = this.textureRequests;
        // let textureAliveRequests = this.textureAliveRequests;
        // let id = zoom + '/' + xtile + '/' + ytile;
        for (let diff = 0; diff < zoom; diff++) {
            let power = Math.pow(2, diff);
            let idZoomOther = (+zoom - diff) + '/' + Math.floor(xtile / power) + '/' + Math.floor(ytile / power);
            // console.log('Looking for texture: ', idZoomOther);
            if (textures.hasOwnProperty(idZoomOther)) {
                // onLoaded(textures[idZoomOther]);
                // origin : bottom left
                let tex = textures[idZoomOther].clone();
                tex.repeat.x = 1 / power;
                tex.repeat.y = 1 / power;
                let xOffset = xtile - Math.floor(xtile / power) * power;
                    // console.log('xOffset: ', xOffset);
                let yOffset = (power - 1) - (ytile - Math.floor(ytile / power) * power);
                // console.log('yOffset: ', yOffset);
                tex.offset.x = xOffset * tex.repeat.x;
                tex.offset.y = yOffset * tex.repeat.y;
                tex.needsUpdate = true;
                onLoaded(tex);
                return;
            }
        }
        // for (var diff = Math.min(zoom - 19, -8); diff < Math.min(zoom - 1, -1); diff++) {
        //     var power = Math.pow(2, diff);
        //     var idZoomOther = (+zoom - diff) + '/' + Math.floor(xtile / power) + '/' + Math.floor(ytile / power);
        //     // console.log('Looking for texture: ', idZoomOther);
        //     if (textures.hasOwnProperty(idZoomOther)) {
        //         // onLoaded(textures[idZoomOther]);
        //         // origin : bottom left
        //         var tex = textures[idZoomOther].clone();
        //         tex.repeat.x = 1 / power;
        //         tex.repeat.y = 1 / power;
        //         var xOffset = xtile - Math.floor(xtile / power) * power
        //         console.log('xOffset: ', xOffset);
        //         var yOffset = (power - 1) - (ytile - Math.floor(ytile / power) * power);
        //         console.log('yOffset: ', yOffset);
        //         tex.offset.x = xOffset * tex.repeat.x;
        //         tex.offset.y = yOffset * tex.repeat.y;
        //         tex.needsUpdate = true;
        //         onLoaded(tex);
        //         return;
        //     }
        // }
    }
    tileFactory(url, zoom, xtile, ytile, onLoaded) {
        // let scope = this;
        let textures = this.textures;
        let textureRequests = this.textureRequests;
        // let textureAliveRequests = this.textureAliveRequests;
        // var id = 'tile' + zoom + '_' + xtile + '_' + ytile + '_' + layerName;
        // var myUrl = new URL(url);
        let id = zoom + '/' + xtile + '/' + ytile;
        if (textures.hasOwnProperty(id)) {
            // onLoaded(textures[id]);
        } else {
            this.textureRequestsCount = this.textureRequestsCount + (textureRequests.hasOwnProperty(id) ? 0 : 1);
            // console.log('scope.textureAliveRequestsCount: ', scope.textureAliveRequestsCount);
            // console.log('scope.textureRequestsCount: ', scope.textureRequestsCount);
            textureRequests[id] = {
                zoom: zoom,
                xtile: xtile,
                ytile: ytile,
                url: url,
                onLoaded: onLoaded
            };
            this.loadNextTile();
        }
    }
    cancelOtherRequests(currentIds) {
        // let scope = this;
        // let textures = this.textures;
        let textureRequests = this.textureRequests;
        let textureAliveRequests = this.textureAliveRequests;
        // console.log('currentIds: ', JSON.stringify(currentIds));
        for (let id in textureRequests) {
            if (!currentIds.hasOwnProperty(id)) {
                delete textureRequests[id];
                this.textureRequestsCount--;
                // console.log('id: ', id);
                // console.log('(1) scope.textureAliveRequestsCount: ', scope.textureAliveRequestsCount);
                // console.log('(1) scope.textureRequestsCount: ', scope.textureRequestsCount);
            }
        }
        for (let id in textureAliveRequests) {
            if (!currentIds.hasOwnProperty(id)) {
                // if (textureAliveRequests[id].request.hasOwnProperty('abort')) {
                //     textureAliveRequests[id].request.abort();
                // }
                // delete textureAliveRequests[id];
                // textureAliveRequestsCount--;
            }
        }
        this.loadNextTile();
    }

}
TileLoader.MAX_TEXTURE_REQUEST = 10;
export default new TileLoader();
