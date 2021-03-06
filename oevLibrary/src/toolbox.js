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
// var OpenEarthView = require("./openearthview.js");
var THREE = require('THREE');

let instance = null;
//
// class Cache {
//     constructor() {
//         if (!instance) {
//             instance = this;
//         }
//
//         // to test whether we have singleton or not
//         this.time = new Date()
//
//         return instance;
//     }
// }

class Toolbox {
    constructor() {
        if (!instance) {
            instance = this;
        }
        this.geoTiles = {};
        this.geoTileQueue = [];
        this.materials = {};
        this.materialQueue = [];
        return instance;
    }

    assignUVs(geometry) {

        geometry.computeBoundingBox();

        let max = geometry.boundingBox.max;
        let min = geometry.boundingBox.min;

        let offset = new THREE.Vector2(0 - min.x, 0 - min.y);
        let range = new THREE.Vector2(max.x - min.x, max.y - min.y);

        geometry.faceVertexUvs[0] = [];
        let faces = geometry.faces;

        for (let i = 0; i < geometry.faces.length; i++) {
            let v1 = geometry.vertices[faces[i].a];
            let v2 = geometry.vertices[faces[i].b];
            let v3 = geometry.vertices[faces[i].c];

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
                new THREE.Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
                new THREE.Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
            ]);
        }
        geometry.uvsNeedUpdate = true;
    }
    getTileMesh(r, zoom, ytile, power) {

        let id = 'tile_' + zoom + '_' + ytile + '_' + power;

        if (!(this.geoTiles.hasOwnProperty(id))) {
            this.geoTiles[id] = new THREE.Geometry();
            let myGeometry = this.geoTiles[id];

            this.geoTileQueue.push(id);
            if (this.geoTileQueue.length > this.MAX_TILEMESH) {
                delete this.geoTiles[this.geoTileQueue.shift()];
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
            let lonStart = Toolbox.tile2long(0, zoom);
            let latStart = Toolbox.tile2lat(ytile, zoom);
            let lonEnd = Toolbox.tile2long(1, zoom);
            let latEnd = Toolbox.tile2lat(ytile + 1, zoom);
            let factor = Math.pow(2, power);
            let lonStep = (lonEnd - lonStart) / factor;
            let latStep = (latEnd - latStart) / factor;

            for (let u = 0; u < factor; u++) {
                for (let v = 0; v < factor; v++) {

                    let lon1 = lonStart + lonStep * u;
                    let lat1 = latStart + latStep * v;
                    let lon2 = lonStart + lonStep * (u + 1);
                    let lat2 = latStart + latStep * (v + 1);

                    let rUp = r * 1000 * Math.cos(lat1 * Math.PI / 180);
                    let rDown = r * 1000 * Math.cos(lat2 * Math.PI / 180);

                    let Ax = rDown * Math.sin(lon1 * Math.PI / 180);
                    let Ay = r * 1000 * Math.sin(lat2 * Math.PI / 180);
                    let Az = rDown * Math.cos(lon1 * Math.PI / 180);

                    let Bx = rUp * Math.sin(lon1 * Math.PI / 180);
                    let By = r * 1000 * Math.sin(lat1 * Math.PI / 180);
                    let Bz = rUp * Math.cos(lon1 * Math.PI / 180);

                    let Cx = rUp * Math.sin(lon2 * Math.PI / 180);
                    let Cy = r * 1000 * Math.sin(lat1 * Math.PI / 180);
                    let Cz = rUp * Math.cos(lon2 * Math.PI / 180);

                    let Dx = rDown * Math.sin(lon2 * Math.PI / 180);
                    let Dy = r * 1000 * Math.sin(lat2 * Math.PI / 180);
                    let Dz = rDown * Math.cos(lon2 * Math.PI / 180);

                    myGeometry.vertices.push(
                        new THREE.Vector3(Ax, Ay, Az),
                        new THREE.Vector3(Bx, By, Bz),
                        new THREE.Vector3(Cx, Cy, Cz),
                        new THREE.Vector3(Dx, Dy, Dz)
                    );

                    let iStep = (factor - v - 1) + u * factor;

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
    }

    // static getSearchParameters() {
    //     let prmstr = window.location.search.substr(1);
    //     return prmstr !== null && prmstr !== '' ? transformToAssocArray(prmstr) : {};
    // }
    static long2tile(lon, zoom) {
        return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
    }
    static lat2tile(lat, zoom) {
        return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
    }
    static tile2long(x, z) {
        return ((x / Math.pow(2, z) * 360 - 180) + 540) % 360 - 180;
    }
    static tile2lat(y, z) {
        var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
        return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
    }
    static measure(lat1, lon1, lat2, lon2) { // generally used geo measurement function
        // var R = 6378.137; // Radius of earth in KM
        let dLat = (lat2 - lat1) * Math.PI / 180;
        let dLon = (lon2 - lon1) * Math.PI / 180;
        let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = Toolbox.R * c;
        return d * 1000; // meters
    }
    static lonOffsetMeter2lon(lon, lat, x) {
        return x / (Toolbox.R * Math.cos(lat)) + lon;
    }
    static latOffsetMeter2lat(lat, y) {
        return (y / Toolbox.R) + lat;
    }

    static makeTextSprite(message, parameters) {
        if (parameters === undefined) parameters = {};
        let fontface = parameters.hasOwnProperty('fontface') ?
            parameters['fontface'] : 'Arial';
        let fontsize = parameters.hasOwnProperty('fontsize') ?
            parameters['fontsize'] : 108;
        let borderThickness = parameters.hasOwnProperty('borderThickness') ?
            parameters['borderThickness'] : 4;
        let borderColor = parameters.hasOwnProperty('borderColor') ?
            parameters['borderColor'] : {
                r: 0,
                g: 0,
                b: 0,
                a: 1.0
            };
        let backgroundColor = parameters.hasOwnProperty('backgroundColor') ?
            parameters['backgroundColor'] : {
                r: 255,
                g: 255,
                b: 255,
                a: 1.0
            };

        // let spriteAlignment = THREE.SpriteAlignment.topLeft;

        let canvas = document.createElement('canvas');
        // let canvas = document.getElementById('osmworld');
        console.log('canvas:', canvas);
        let context = canvas.getContext('2d');
        context.font = 'Bold ' + fontsize + 'px ' + fontface;

        // get size data (height depends only on font size)
        let metrics = context.measureText(message);
        let textWidth = metrics.width;

        // background color
        context.fillStyle = 'rgba(' + backgroundColor.r + ',' + backgroundColor.g + ',' + backgroundColor.b + ',' + backgroundColor.a + ')';
        // border color
        context.strokeStyle = 'rgba(' + borderColor.r + ',' + borderColor.g + ',' + borderColor.b + ',' + borderColor.a + ')';

        context.lineWidth = borderThickness;
        Toolbox.roundRect(context, borderThickness / 2 + 140 - textWidth / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
        // Toolbox.roundRect(context, borderThickness / 2 + textWidth / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);

        // 1.4 is extra height factor for text below baseline: g,j,p,q.

        // text color
        context.fillStyle = 'rgba(0, 0, 0, 1.0)';

        context.fillText(message, borderThickness + 140 - textWidth / 2, fontsize + borderThickness);
        // context.fillText(message, 0, fontsize + borderThickness);

        // canvas contents will be used for a texture
        let texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        let spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            useScreenCoordinates: false
                // alignment: spriteAlignment
        });
        let sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(100, 50, 1.0);
        return sprite;
    }
    static roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    static originAxes(radius, height) {
        // static originAxes() {
        let origin = new THREE.Object3D();

        //radiusTop, radiusBottom, height, segmentsRadius, segmentsHeight, openEnded
        let ge3 = new THREE.CylinderGeometry(radius, radius, height, 4, 1);
        let axeXMesh = new THREE.Mesh(ge3,
            new THREE.MeshBasicMaterial({
                color: Math.random() * 0xffffff,
                opacity: 0.7
            })
        );
        axeXMesh.rotation.set(0, 0, Math.PI / 2);
        axeXMesh.position.setX(500);
        origin.add(axeXMesh);
        let axeYMesh = new THREE.Mesh(ge3,
            new THREE.MeshBasicMaterial({
                color: Math.random() * 0xffffff,
                opacity: 0.7
            })
        );
        axeYMesh.position.setY(500);
        origin.add(axeYMesh);
        let axeZMesh = new THREE.Mesh(ge3,
            new THREE.MeshBasicMaterial({
                color: Math.random() * 0xffffff,
                opacity: 0.7
            })
        );
        axeZMesh.rotation.set(Math.PI / 2, 0, 0);
        axeZMesh.position.setZ(500);
        origin.add(axeZMesh);
        return origin;
    }
};
Toolbox.R = 6378.137;
Toolbox.singleton = new Toolbox();
export default Toolbox;
