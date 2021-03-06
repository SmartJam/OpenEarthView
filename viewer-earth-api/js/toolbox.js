// TOOLBOX //
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
*/

// OpenEarthView.toolbox = function() {
//     this.textureLoader = new THREE.TextureLoader();
//     this.textureLoader.crossOrigin = '';
// };

OpenEarthView.toolbox = {
    assignUVs: function(geometry) {

        geometry.computeBoundingBox();

        var max = geometry.boundingBox.max;
        var min = geometry.boundingBox.min;

        var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
        var range = new THREE.Vector2(max.x - min.x, max.y - min.y);

        geometry.faceVertexUvs[0] = [];
        var faces = geometry.faces;

        for (i = 0; i < geometry.faces.length; i++) {
            var v1 = geometry.vertices[faces[i].a];
            var v2 = geometry.vertices[faces[i].b];
            var v3 = geometry.vertices[faces[i].c];

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
                new THREE.Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
                new THREE.Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
            ]);
        }
        geometry.uvsNeedUpdate = true;
    },
    geoTiles: {},
    geoTileQueue: [],
    getTileMesh: function(r, zoom, ytile, power) {
        var id = 'tile_' + zoom + '_' + ytile + '_' + factor;
        if (!(this.geoTiles.hasOwnProperty(id))) {
            this.geoTiles[id] = new THREE.Geometry();
            var myGeometry = this.geoTiles[id];
            this.geoTileQueue.push(id);
            if (this.geoTileQueue.length > this.MAX_TILEMESH) {
                delete geoTiles[this.geoTileQueue.shift()];
            }
            /*************************
             *            ^ Y         *
             *            |           *
             *            |           *
             *            |           *
             *            -------> X  *
             *           /            *
             *          /             *
             *         / Z            *
             *************************/
            /***************************
             *       B        C         *
             *                          *
             *                          *
             *                          *
             *      A          D        *
             ***************************/
            var lonStart = this.tile2long(0, zoom);
            var latStart = this.tile2lat(ytile, zoom);
            var lonEnd = this.tile2long(1, zoom);
            var latEnd = this.tile2lat(ytile + 1, zoom);
            var factor = Math.pow(2, power);
            var lonStep = (lonEnd - lonStart) / factor;
            var latStep = (latEnd - latStart) / factor;
            for (var u = 0; u < factor; u++) {
                for (var v = 0; v < factor; v++) {

                    var lon1 = lonStart + lonStep * u;
                    var lat1 = latStart + latStep * v;
                    var lon2 = lonStart + lonStep * (u + 1);
                    var lat2 = latStart + latStep * (v + 1);

                    var rUp = r * 1000 * Math.cos(lat1 * Math.PI / 180);
                    var rDown = r * 1000 * Math.cos(lat2 * Math.PI / 180);

                    var Ax = rDown * Math.sin(lon1 * Math.PI / 180);
                    var Ay = r * 1000 * Math.sin(lat2 * Math.PI / 180);
                    var Az = rDown * Math.cos(lon1 * Math.PI / 180);

                    var Bx = rUp * Math.sin(lon1 * Math.PI / 180);
                    var By = r * 1000 * Math.sin(lat1 * Math.PI / 180);
                    var Bz = rUp * Math.cos(lon1 * Math.PI / 180);

                    var Cx = rUp * Math.sin(lon2 * Math.PI / 180);
                    var Cy = r * 1000 * Math.sin(lat1 * Math.PI / 180);
                    var Cz = rUp * Math.cos(lon2 * Math.PI / 180);

                    var Dx = rDown * Math.sin(lon2 * Math.PI / 180);
                    var Dy = r * 1000 * Math.sin(lat2 * Math.PI / 180);
                    var Dz = rDown * Math.cos(lon2 * Math.PI / 180);

                    myGeometry.vertices.push(
                        new THREE.Vector3(Ax, Ay, Az),
                        new THREE.Vector3(Bx, By, Bz),
                        new THREE.Vector3(Cx, Cy, Cz),
                        new THREE.Vector3(Dx, Dy, Dz)
                    );

                    var iStep = (factor - v - 1) + u * factor;
                    myGeometry.faces.push(new THREE.Face3(
                        4 * iStep,
                        4 * iStep + 2,
                        4 * iStep + 1));
                    myGeometry.faces.push(new THREE.Face3(
                        4 * iStep,
                        4 * iStep + 3,
                        4 * iStep + 2));

                    myGeometry.faceVertexUvs[0].push([
                        new THREE.Vector2((0.0 + u) / factor, (0.0 + v) / factor),
                        new THREE.Vector2((1.0 + u) / factor, (1.0 + v) / factor),
                        new THREE.Vector2((0.0 + u) / factor, (1.0 + v) / factor)
                    ]);
                    myGeometry.faceVertexUvs[0].push([
                        new THREE.Vector2((0.0 + u) / factor, (0.0 + v) / factor),
                        new THREE.Vector2((1.0 + u) / factor, (0.0 + v) / factor),
                        new THREE.Vector2((1.0 + u) / factor, (1.0 + v) / factor)
                    ]);
                }
            }
            myGeometry.uvsNeedUpdate = true;
        }
        return new THREE.Mesh(this.geoTiles[id]);
    },
    materials: {},
    materialQueue: [],
    getSearchParameters: function() {
        var prmstr = window.location.search.substr(1);
        return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
    },
    long2tile: function(lon, zoom) {
        return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
    },
    lat2tile: function(lat, zoom) {
        return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
    },
    tile2long: function(x, z) {
        return ((x / Math.pow(2, z) * 360 - 180) + 540) % 360 - 180;
    },
    tile2lat: function(y, z) {
        var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
        return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
    },
    measure: function(lat1, lon1, lat2, lon2) { // generally used geo measurement function
        // var R = 6378.137; // Radius of earth in KM
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d * 1000; // meters
    },
    lonOffsetMeter2lon: function(lon, lat, x) {
        return x / (R * Math.cos(lat)) + lon;
    },
    latOffsetMeter2lat: function(lat, y) {
        var R = 6378.137;
        return (y / R) + lat;
    }
};
