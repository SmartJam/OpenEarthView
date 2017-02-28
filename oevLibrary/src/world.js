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

// export default OpenEarthView.World = {};
//   //
// }
// require("imports-loader?toolbox=OpenEarthView.toolbox!./openearthview.js");

// OpenEarthView.Terrain.FlatTerrain = require("./terrains/FlatTerrain.js");
var FlatTerrain = require('./terrains/flatTerrain.js');
var toolbox = require('./toolbox.js');
var tileLoader = require('./loaders/TileLoader.js');
var R = 6378.137;
var THREE = require('THREE');

// THREE.EarthControls = require('./controls/EarthControls_class.js');
// THREE.EarthControls = require('./controls/EarthControls_function.js');
let self;
class World {
    constructor(domElement) {
        self = this;

        this.domElement = domElement;
        this.terrains = {};
        this.terrains['FlatTerrain'] = new FlatTerrain('FlatTerrain', null, null);
        this.layers = {};
        this.loaders = {};
        if (this.domElement === null) {
            alert('No domElement defined.');
            return;
        }
        this.lastSelectedBuilding = {
            id: undefined,
            tileMesh: undefined,
            bboxMesh: undefined,
            bboxCenter: undefined,
            building: undefined
        };
        // if (this.layers.length === 0) {
        //     this.layers[0] = new OpenEarthView.Layer.OSM("defaultLayer");
        // }
        this.ZOOM_SHIFT_SIZE = 4;
        this.MAX_TILEMESH = 400;
        // this.ZOOM_FLAT = 13;
        this.ZOOM_MIN = 1;
        this.tileMeshes = {};
        this.tileMeshQueue = [];
        this.LONGITUDE_ORI = -73.98468017578125;
        this.LATITUDE_ORI = 40.7477771608207;
        this.R = 6378.137;
        this.xtile = 0;
        this.ytile = 0;
        this.zoom = 0;
        this.tileGroups;
        this.tileGroup = [];
        this.defaultAlti = 150;

        // this.geojsonLoader = new THREE.GeojsonLoader();
        // this.geojsonLoader = THREE.GeojsonLoader.getSingleton();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000000);
        // console.log('camera:', JSON.stringify(this.camera));
        this.camera.up.set(0, 0, 1);

        this.domElement = document.getElementById(domElement);
        // console.log('container.clientWidth:', container.clientWidth)
        // console.log('container.clientHeight:', container.clientHeight)
        // document.body.appendChild(this.canvas);

        // var background = document.createElement('Background');
        // background.setAttribute('groundColor', '0.972 0.835 0.666');
        // background.setAttribute('skyAngle', '1.309 1.571');
        // background.setAttribute('skyColor', '0.0 0.2 0.7 0.0 0.5 1.0 1.0 1.0 1.0');
        // scene.appendChild(background);
        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', 'openearthviewcanvas');
        this.domElement.appendChild(this.canvas);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas
        });
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        // renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        //
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        // this.canvas.appendChild(this.renderer.domElement);

        this.renderer.shadowMapEnabled = true;
        this.renderer.shadowMapSoft = false;

        this.renderer.shadowCameraNear = 3;
        this.renderer.shadowCameraFar = this.camera.far;
        this.renderer.shadowCameraFov = 50;

        this.renderer.shadowMapBias = 0.0039;
        this.renderer.shadowMapDarkness = 0.5;
        this.renderer.shadowMapWidth = 1024;
        this.renderer.shadowMapHeight = 1024;

        this.lonStamp = 0;
        this.latStamp = 0;
        this.altitude = this.defaultAlti;
        this.scene = new THREE.Scene();

        // document.body.appendChild(renderer.domElement);
        this.buildingObjects = [];
        this.earth = new THREE.Object3D();
        this.earth.position.set(0, 0, -this.R * 1000);
        this.scene.add(this.earth);

        // this.selectedBuildingContainer = new THREE.Object3D();
        // this.scene.add(this.selectedBuildingContainer);

        let light1 = new THREE.DirectionalLight(0xf0f0e0, 1);
        let light2 = new THREE.DirectionalLight(0xf0f0e0, 1);
        let light3 = new THREE.DirectionalLight(0xffffe0, 1);

        light1.position.set(10000, 0, 100000);
        light2.position.set(-5000, 8700, 10000);
        light3.position.set(-5000, -8700, 1000);
        // var light4 = new THREE.DirectionalLight(0xffffff, 1);
        // light4.position.set(-10000, 10000, 20000);
        this.scene.add(light1);
        this.scene.add(light2);
        this.scene.add(light3);
        // this.scene.add(light4);

        document.addEventListener('keydown', this.onDocumentKeyDown, false);
        this.camera.position.z = this.altitude;
        // let scope = this;
        this.controls = new THREE.EarthControls(
            this.camera,
            this.renderer.domElement,
            () => {
                self.render();
            },
            () => {
                self.updateSceneLazy();
            }, {
                longitude: this.LONGITUDE_ORI,
                latitude: this.LATITUDE_ORI
            },
            (event) => {
                this.onSelectObject(event);
            }
        );

        // var canvas = document.getElementById('world');
        // this.canvas.addEventListener('resize', this.onWindowResize, false);
        window.addEventListener('resize', () => {
            // console.log('coucou !!!');
            // console.log('this.domElement.clientWidth:', this.domElement.clientWidth);
            var width = self.domElement.clientWidth;
            var height = self.domElement.clientHeight;

            self.renderer.setViewport(0, 0, width, self.canvas.height);
            self.renderer.setSize(width, height);
            self.camera.aspect = width / height;
            self.camera.updateProjectionMatrix();
            self.render();
        }, false);

        //     canvas.addEventListener('resize', function () {
        //   canvas.width  = canvas.clientWidth;
        //   canvas.height = canvas.clientHeight;
        //   renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        //   camera.aspect = canvas.clientWidth / canvas.clientHeight;
        //   camera.updateProjectionMatrix();
        // });

        // canvas.width  = canvas.clientWidth;
        // canvas.height = canvas.clientHeight;
        // renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        // camera.aspect = canvas.clientWidth / canvas.clientHeight;
        // camera.updateProjectionMatrix();

        // this.onWindowResize = function() {
        //     console.log("Call to onWindowResize.");
        //     // var container = document.getElementById("world");
        //     this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        //     this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        //     this.camera.updateProjectionMatrix();
        //
        //     // renderer.setSize(window.innerWidth, window.innerHeight);
        //     // render();
        // }
    };
    // var scope = this;

    onSelectObject(event) {
        let scope = this;
        console.log('Select object !');
        console.log('event:{clientX:', event.clientX, ', clientY:', event.clientY, '}');
        console.log('event:{offsetX:', event.offsetX, ', offsetY:', event.offsetY, '}');
        console.log('self.renderer.domElement:{clientWidth:', self.renderer.domElement.clientWidth, ', clientHeight:', self.renderer.domElement.clientHeight, '}');
        let mouse = new THREE.Vector3(
            (event.offsetX / self.renderer.domElement.clientWidth) * 2 - 1, -(event.offsetY / self.renderer.domElement.clientHeight) * 2 + 1,
            0.5);
        event.preventDefault();

        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, self.camera);

        for (let layerId in self.layers) {
            console.log('self.layers[layerId].type:', JSON.stringify(self.layers[layerId].type));

            switch (self.layers[layerId].type) {
                case 'building':

                    console.log('self.buildingObjects:', (self.buildingObjects));
                    // let intersects = raycaster.intersectObjects(self.buildingObjects, true);

                    let intersects = raycaster.intersectObjects(self.buildingObjects, false);
                    //
                    console.log('intersects.length:', JSON.stringify(intersects.length));
                    // console.log('intersects.length:', JSON.stringify(intersects.length));
                    if (intersects.length > 0) {
                        console.log('intersects:', (intersects));
                        let distance = 0;
                        let intersect = null;
                        for (let idx = 0; idx < intersects.length; idx++) {
                            if (distance === 0 || intersects[idx].distance < distance) {
                                intersect = intersects[idx];
                                distance = intersect.distance;
                            }
                        }
                        if (intersect === null) break;
                        if (!intersect.object.hasOwnProperty('geometry')) break;
                        let building = intersect.object.parent;
                        if (scope.lastSelectedBuilding.id !== undefined && building.userData.osm.id === scope.lastSelectedBuilding.id) {
                            // BREAK
                            break;
                        }
                        if (scope.lastSelectedBuilding.id !== undefined && building.userData.osm.id !== scope.lastSelectedBuilding.id) {
                            // Remove previous selection.
                            scope.lastSelectedBuilding.tileMesh.remove(scope.lastSelectedBuilding.bboxMesh);
                            scope.lastSelectedBuilding.tileMesh.remove(scope.lastSelectedBuilding.bboxCenter);
                            for (let i = scope.lastSelectedBuilding.building.children.length - 1; i >= 0; i--) {
                                let buildingBlockMesh = scope.lastSelectedBuilding.building.children[i];
                                buildingBlockMesh.material.transparent = false;
                            }
                            // scope.lastSelectedBuildinguildingBlockMesh.material.transparent = true;
                        }

                        for (let i = building.children.length - 1; i >= 0; i--) {
                            let buildingBlockMesh = building.children[i];
                            buildingBlockMesh.material.transparent = true;

                            // buildingBlockMesh.material = new THREE.MeshPhongMaterial({
                            //     color: buildingBlockMesh.material.color,
                            //     transparent: true,
                            //     opacity: 0.4
                            // });
                        }

                        let tileMesh = building.parent;

                        console.log('intersect:', intersect);
                        console.log('intersect.object:', JSON.stringify(intersect.object));
                        console.log('intersect.object.userData:', intersect.object.userData);
                        console.log('building:', building);

                        // Tutorial - Process bounding box - method setFromObject
                        // Scene coordinates.
                        // let setFromObject = new THREE.Box3().setFromObject(building);

                        // Tutorial - Process bounding box - method computeBoundingBox
                        // Bad: not hierarchical.
                        // Target object coordinates.
                        // buildingBlock.object.geometry.computeBoundingBox();
                        // let computeBoundingBox = buildingBlock.object.geometry.boundingBox.clone();

                        // Tutorial - Process bounding box - method BoxHelper
                        let bboxMesh = new THREE.BoxHelper(building);
                        console.log('bboxMesh: ', bboxMesh);
                        let bboxWorldPos = new THREE.Vector3();
                        bboxWorldPos.setFromMatrixPosition(tileMesh.matrixWorld);
                        console.log('bboxWorldPos: ', bboxWorldPos);
                        bboxMesh.position.setX(-bboxWorldPos.x);
                        bboxMesh.position.setY(-bboxWorldPos.y);

                        let bboxCenter = new THREE.Object3D();
                        bboxCenter.position.set(
                            bboxMesh.geometry.boundingSphere.center.x - bboxWorldPos.x,
                            bboxMesh.geometry.boundingSphere.center.y - bboxWorldPos.y,
                            bboxMesh.geometry.boundingSphere.center.z - bboxWorldPos.z);
                        // bboxCenter.add(toolbox.originAxes(4, 1000));

                        tileMesh.add(bboxCenter);
                        tileMesh.add(bboxMesh);

                        scope.lastSelectedBuilding.id = building.userData.osm.id;
                        scope.lastSelectedBuilding.tileMesh = tileMesh;
                        scope.lastSelectedBuilding.bboxMesh = bboxMesh;
                        scope.lastSelectedBuilding.bboxCenter = bboxCenter;
                        scope.lastSelectedBuilding.building = building;

                        // Add axis to scene
                        // self.scene.add(toolbox.originAxes(4, 1000));

                        console.log('building.userData.info.tags:', building.userData.osm.tags.building);

                        let message = 'id: ' + building.userData.osm.id;
                        if (building.userData.osm.tags.hasOwnProperty('name')) {
                            message = building.userData.osm.tags.name;
                        } else if (building.userData.osm.tags.hasOwnProperty('addr:street')) {
                            message = (building.userData.osm.tags.hasOwnProperty('addr:housenumber')) ? building.userData.osm.tags['addr:housenumber'] : '';
                            message = building.userData.osm.tags['addr:street'];
                        }

                        let spritey = toolbox.makeTextSprite(message, {
                            fontsize: 24,
                            borderColor: {
                                r: 255,
                                g: 0,
                                b: 0,
                                a: 1.0
                            },
                            backgroundColor: {
                                r: 255,
                                g: 100,
                                b: 100,
                                a: 0.8
                            }
                        });
                        // let spritey2 = toolbox.makeTextSprite('abcdefghijkl', {
                        //     fontsize: 24,
                        //     borderColor: {
                        //         r: 255,
                        //         g: 0,
                        //         b: 0,
                        //         a: 1.0
                        //     },
                        //     backgroundColor: {
                        //         r: 255,
                        //         g: 100,
                        //         b: 100,
                        //         a: 0.8
                        //     }
                        // });
                        // let spritey3 = toolbox.makeTextSprite(
                        //     'abcdefghijklmnopqrstuv', {
                        //         fontsize: 24,
                        //         borderColor: {
                        //             r: 255,
                        //             g: 0,
                        //             b: 0,
                        //             a: 1.0
                        //         },
                        //         backgroundColor: {
                        //             r: 255,
                        //             g: 100,
                        //             b: 100,
                        //             a: 0.8
                        //         }
                        //     });

                        spritey.position.setZ(bboxMesh.geometry.boundingSphere.radius);
                        // spritey2.position.setZ(bboxMesh.geometry.boundingSphere.radius + 35);
                        // spritey3.position.setZ(bboxMesh.geometry.boundingSphere.radius + 70);

                        console.log('spritey:', spritey);

                        bboxCenter.add(spritey);
                        // bboxCenter.add(spritey2);
                        // bboxCenter.add(spritey3);

                        self.render();
                    }

                    /*
                    // Parse all the faces
                    for ( var i in intersects ) {

                    	intersects[ i ].face.material[ 0 ].color.setHex( Math.random() * 0xffffff | 0x80000000 );

                    }
                    */
                    break;
            }
        }

        // console.log('intersects:', JSON.stringify(intersects));
        //
        // if (intersects.length > 0) {
        //     intersects[0].object.material.color.setHex(Math.random() * 0xffffff);
        // }
    }

    // LAYERS
    addLayer(openEarthViewLayer, openEarthViewLoader) {
        let layerName = openEarthViewLayer.getName();
        console.log('Add layer:', layerName);
        if (this.layers.hasOwnProperty('defaultLayer')) {
            delete this.layers['defaultLayer'];
        }
        // if (this.layers.length === 1 && this.layers[0].getName() === "defaultLayer") {
        //     this.layers.pop();
        // }
        // this.layers[this.layers.length] = openEarthViewLayer;
        this.layers[layerName] = openEarthViewLayer;
        this.loaders[layerName] = openEarthViewLoader;

        for (let xtile = 0; xtile < 4; xtile++) {
            for (let ytile = 0; ytile < 4; ytile++) {
                if (openEarthViewLayer.type === 'tile') {
                    tileLoader.tileFactory(
                        openEarthViewLayer.getUrl(2, xtile, ytile),
                        2,
                        xtile,
                        ytile,
                        (texture) => {
                            // tileMesh.material.map = texture;
                            // tileMesh.material.needsUpdate = true;
                            // this.render();
                        }
                    );
                }
            }
        }
    }

    // this.addTerrain("defaultTerrain", new OpenEarthView.Terrain.FlatTerrain("FlatTerrain"));
    // world.addTerrain(new OpenEarthView.Terrain.FlatTerrain("FlatTerrain"));

    addTerrain(openEarthViewTerrain) {
        console.log('Add terrain:', openEarthViewTerrain.getName());
        if (this.terrains.hasOwnProperty('defaultTerrain')) {
            delete this.terrains['defaultTerrain'];
        }
        this.terrains[openEarthViewTerrain.getName()] = openEarthViewTerrain;
    };

    // for (layerIdx = 0; layerIdx < layers.length; layerIdx++) {
    //     this.addLayer(layers[layerIdx]);
    // }
    //

    // var toolbox = OpenEarthView.toolbox;
    // var terrainLoader = new OpenEarthView.TerrainLoader();

    // this.updateSceneLazy();

    render() {
        // requestAnimationFrame(render);
        // //////////////////////////////////////////////////////////
        // var oldXtile;
        // var oldYtile;
        // var oldZoom = this.zoom;
        // var dist = new THREE.Vector3().copy(this.controls.object.position).sub(this.controls.target).length();
        // var zoom__ = Math.floor(Math.max(Math.min(Math.floor(27 - Math.log2(dist)), 19), 1));

        // if (zoom__ > this.ZOOM_MIN) {
        //     this.zoom = zoom__;
        // }

        if (this.lonStamp !== this.controls.getLongitude() ||
            this.latStamp !== this.controls.getLatitude()) {
            // this.lonStamp = this.controls.getLongitude();
            // this.latStamp = this.controls.getLatitude();
            this.earth.rotation.set(
                this.controls.getLatitude() * Math.PI / 180,
                (-this.controls.getLongitude()) * Math.PI / 180,
                0);
            // oldXtile = this.xtile;
            // oldYtile = this.ytile;
            // console.log('toolbox:', toolbox);
            // this.xtile = toolbox.long2tile(this.lonStamp, this.zoom);
            // this.ytile = toolbox.lat2tile(this.latStamp, this.zoom);

            // if (Math.abs(oldXtile - this.xtile) >= 1 ||
            //     Math.abs(oldYtile - this.ytile) >= 1) {
            //     this.updateScene({
            //         'lon': this.lonStamp,
            //         'lat': this.latStamp,
            //         'alti': this.altitude
            //     });
            // }
        }
        // else if (Math.abs(this.zoom - oldZoom) >= 1) {
        //     this.updateScene({
        //         'lon': this.lonStamp,
        //         'lat': this.latStamp,
        //         'alti': this.altitude
        //     });
        // }

        // //////////////////////////////////////////////////////////
        this.renderer.render(this.scene, this.camera);
    }

    updateSceneLazy() {
        // requestAnimationFrame(render);
        // //////////////////////////////////////////////////////////
        var oldXtile;
        var oldYtile;
        var oldZoom = this.zoom;
        var dist = new THREE.Vector3().copy(this.controls.object.position).sub(this.controls.target).length();
        var zoom__ = Math.floor(Math.max(Math.min(Math.floor(27 - Math.log2(dist)), 19), 1));

        if (zoom__ > this.ZOOM_MIN) {
            this.zoom = zoom__;
        }

        if (this.lonStamp !== this.controls.getLongitude() ||
            this.latStamp !== this.controls.getLatitude()) {
            this.lonStamp = this.controls.getLongitude();
            this.latStamp = this.controls.getLatitude();
            this.earth.rotation.set(
                this.controls.getLatitude() * Math.PI / 180,
                (-this.controls.getLongitude()) * Math.PI / 180,
                0);
            oldXtile = this.xtile;
            oldYtile = this.ytile;
            // console.log('toolbox:', toolbox);
            this.xtile = toolbox.long2tile(this.lonStamp, this.zoom);
            this.ytile = toolbox.lat2tile(this.latStamp, this.zoom);

            if (Math.abs(oldXtile - this.xtile) >= 1 ||
                Math.abs(oldYtile - this.ytile) >= 1) {
                this.updateScene({
                    'lon': this.lonStamp,
                    'lat': this.latStamp,
                    'alti': this.altitude
                });
            }
        } else if (Math.abs(this.zoom - oldZoom) >= 1) {
            this.updateScene({
                'lon': this.lonStamp,
                'lat': this.latStamp,
                'alti': this.altitude
            });
        }

        // //////////////////////////////////////////////////////////
        this.renderer.render(this.scene, this.camera);
    }

    //
    // goUpdateSceneLazy() {
    //     self.updateSceneLazy();
    // }

    updateScene(position) {
        // function updateScene(position) {
        let tiles = {};
        let currentIds = {};
        let zoomMax;
        let zoomMin;
        let oriGround;

        this.xtile = toolbox.long2tile(position.lon, this.zoom);
        this.ytile = toolbox.lat2tile(position.lat, this.zoom);
        this.earth.remove(this.tileGroups);
        this.buildingObjects = [];
        this.tileGroups = new THREE.Object3D();
        this.earth.add(this.tileGroups);
        oriGround = new THREE.Object3D();
        if (this.zoom >= World.ZOOM_FLAT) {
            let xtileOri = toolbox.long2tile(position.lon, World.ZOOM_FLAT);
            let ytileOri = toolbox.lat2tile(position.lat, World.ZOOM_FLAT);
            let lonOri = toolbox.tile2long(xtileOri, World.ZOOM_FLAT);
            let latOri = toolbox.tile2lat(ytileOri, World.ZOOM_FLAT);
            let oriLatRot;
            let oriLonRot;

            // 3 - ground position
            oriGround.position.set(0, 0, this.R * 1000);
            // 2 - Latitude rotation
            oriLatRot = new THREE.Object3D();
            oriLatRot.rotation.set((-latOri) * Math.PI / 180, 0, 0);
            oriLatRot.add(oriGround);
            // 1 - Longitude rotation
            oriLonRot = new THREE.Object3D();
            oriLonRot.rotation.set(0, lonOri * Math.PI / 180, 0);
            oriLonRot.add(oriLatRot);

            this.tileGroups.add(oriLonRot);
        }

        console.log('position:', JSON.stringify({
            zoom: this.zoom,
            xtile: this.xtile,
            ytile: this.ytile
        }));
        zoomMax = Math.max(this.zoom, this.ZOOM_MIN);
        zoomMin = Math.max(this.zoom - this.ZOOM_SHIFT_SIZE, this.ZOOM_MIN);

        for (let zoom_ = zoomMax; zoom_ > zoomMin; zoom_--) {
            let zShift = this.zoom - zoom_;
            let factor;
            let xtile_;
            let ytile_;
            let size;
            let minXtile;
            let maxXtile;
            let minYtile;
            let maxYtile;
            let modulus;

            this.tileGroup[zShift] = new THREE.Object3D();
            this.tileGroups.add(this.tileGroup[zShift]);

            if (zoom_ < 0 && zShift > 0) {
                continue;
            }
            factor = Math.pow(2, zShift);
            xtile_ = Math.floor(this.xtile / factor);
            ytile_ = Math.floor(this.ytile / factor);
            size = 2;

            if (this.zoom < 8 && zoom_ < 6) {
                size = 2;
            } else if (zoom_ < 19) {
                size = 2;
            }
            minXtile = Math.max(0, Math.floor((xtile_ - (Math.pow(2, (size - 1)) - 1)) / 2) * 2);
            maxXtile = Math.floor((xtile_ + (Math.pow(2, (size - 1)) - 1)) / 2) * 2 + 1;
            minYtile = Math.max(0, Math.floor((ytile_ - (Math.pow(2, (size - 1)) - 1)) / 2) * 2);
            maxYtile = Math.floor((ytile_ + (Math.pow(2, (size - 1)) - 1)) / 2) * 2 + 1;
            modulus = (zoom_ > 0) ? Math.pow(2, zoom_) : 0;

            // minXtile = xtile_;
            // maxXtile = xtile_;
            // minYtile = ytile_;
            // maxYtile = ytile_;
            for (let atile = minXtile; atile <= maxXtile; atile++) {
                for (let btile = minYtile; btile <= maxYtile; btile++) {
                    let id;

                    id = 'z_' + zoom_ + '_' + (atile % modulus) +
                        '_' + (btile % modulus);
                    for (let zzz = 1; zzz <= 2; zzz++) {
                        let idNext;

                        idNext = 'z_' + (zoom_ - zzz) +
                            '_' + Math.floor((atile % modulus) / Math.pow(2, zzz)) +
                            '_' + Math.floor((btile % modulus) / Math.pow(2, zzz));
                        tiles[idNext] = {};
                    }
                    if (!tiles.hasOwnProperty(id)) {
                        let tileSupport;
                        let tileMesh;

                        tileSupport = new THREE.Object3D(); // create an empty container
                        tileMesh = new THREE.Mesh();
                        tileSupport.add(tileMesh);

                        // tileMesh.position.set(0, 0, -10);
                        if (zoom_ < World.ZOOM_FLAT) {
                            let tileEarth;

                            tileEarth = new THREE.Object3D(); // create an empty container
                            tileEarth.rotation.set(0, (toolbox.tile2long(atile, zoom_) + 180) * Math.PI / 180, 0);
                            this.tileGroup[zShift].add(tileEarth);
                            tileMesh = toolbox.singleton.getTileMesh(R, zoom_, btile, Math.max(9 - zoom_, 0));
                            tileEarth.add(tileMesh);
                        } else {
                            for (let terrainId in this.terrains) {
                                // for (var layerIdx = 0; layerIdx < layerIds.length; layerIdx++) {
                                if (!this.terrains.hasOwnProperty(terrainId)) {
                                    continue;
                                }
                                switch (this.terrains[terrainId].type) {
                                    case 'terrain':
                                        ((tileSupport, tileMesh, zoom, xtile, ytile) => {

                                            var lon1 = toolbox.tile2long(xtile, zoom_);
                                            var lon2 = toolbox.tile2long(xtile + 1, zoom_);
                                            var lon = (lon1 + lon2) / 2;
                                            var lat1 = toolbox.tile2lat(ytile, zoom_);
                                            var lat2 = toolbox.tile2lat(ytile + 1, zoom_);
                                            var lat = (lat1 + lat2) / 2;
                                            var widthUp = toolbox.measure(lat, lon1, lat, lon2);
                                            // var widthDown = toolbox.measure(lat2, lon1, lat2, lon2);
                                            var widthSide = toolbox.measure(lat1, lon, lat2, lon);

                                            var tileShape = new THREE.Shape();
                                            var xTileShift = (atile - xtile_) +
                                                (xtile_ % Math.pow(2, zoom_ - World.ZOOM_FLAT));
                                            var yTileShift = (btile - ytile_) +
                                                (ytile_ % Math.pow(2, zoom_ - World.ZOOM_FLAT));
                                            var xA = 0;
                                            var xB = xA;
                                            var xC = widthUp;
                                            var xD = xC;
                                            var yA = -widthSide;
                                            var yB = 0;
                                            var yC = yB;
                                            var yD = yA;
                                            var geometry;

                                            tileShape.moveTo(xA, yA);
                                            tileShape.lineTo(xB, yB);
                                            tileShape.lineTo(xC, yC);
                                            tileShape.lineTo(xD, yD);
                                            tileShape.lineTo(xA, yA);

                                            tileSupport.position.set(xTileShift * widthUp, -yTileShift * widthSide, 0);
                                            oriGround.add(tileSupport);

                                            geometry = new THREE.ShapeGeometry(tileShape);
                                            toolbox.singleton.assignUVs(geometry);
                                            tileMesh.geometry = geometry;

                                            // var url = this.terrains[terrainId].getUrl(
                                            //     zoom,
                                            //     ((zoom > 0) ? (xtile % Math.pow(2, zoom)) : 0),
                                            //     ((zoom > 0) ? (ytile % Math.pow(2, zoom)) : 0));
                                            // terrainLoader.terrainFactory(
                                            //     url,
                                            //     zoom,
                                            //     xtile,
                                            //     ytile,
                                            //     function(geometry) {
                                            //         tileMesh.geometry = geometry;
                                            //         this.render();
                                            //     },
                                            //     this.terrains[terrainId].getName();
                                            // );
                                        })(tileSupport, tileMesh, zoom_, atile % modulus, btile % modulus);

                                        break;
                                }
                            }
                            // if (zoom_ >= 19 && atile == xtile_ && btile == ytile) {
                        }
                        for (let layerId in this.layers) {
                            // console.log('layerId:', layerId);
                            // console.log('this.layers:', JSON.stringify(this.layers));
                            // console.log('this.layers[layerId]:', JSON.stringify(this.layers[layerId]));

                            if (!this.layers.hasOwnProperty(layerId)) {
                                continue;
                            }
                            // console.log('this.layers[',layerId ,']:', JSON.stringify(this.layers[layerId]));
                            switch (this.layers[layerId].type) {
                                case 'tile':
                                    tileMesh.material = new THREE.MeshBasicMaterial({
                                        transparent: ((this.layers[layerId].opacity !== 1)),
                                        opacity: this.layers[layerId].opacity
                                    });
                                    this.render();
                                    tileLoader.tilePreload(
                                        zoom_,
                                        atile % modulus,
                                        btile % modulus,
                                        (texture) => {
                                            tileMesh.material.map = texture;
                                            tileMesh.material.needsUpdate = true;
                                            self.render();
                                        }
                                    );
                                    ((tileMesh, zoom, xtile, ytile, layer) => {
                                        var url = layer.getUrl(
                                            zoom,
                                            ((zoom > 0) ? (xtile % Math.pow(2, zoom)) : 0),
                                            ((zoom > 0) ? (ytile % Math.pow(2, zoom)) : 0));
                                        var tilePath = zoom + '/' + xtile + '/' + ytile;

                                        tileLoader.tileFactory(
                                            url,
                                            zoom,
                                            xtile,
                                            ytile,
                                            texture => {
                                                tileMesh.material.map = texture;
                                                tileMesh.material.needsUpdate = true;
                                                self.render();
                                            }
                                        );
                                        currentIds[tilePath] = {};
                                    })(tileMesh, zoom_, atile % modulus, btile % modulus, this.layers[layerId]);
                                    break;
                                case 'building':
                                    if (this.zoom >= 17 &&
                                        zoom_ >= Math.max(this.zoom - 1, this.layers[layerId].minZoom)) {
                                        const defaultColor =
                                            ((13 * this.zoom) % 256) * 65536 +
                                            ((53 * (atile % modulus)) % 256) * 256 +
                                            ((97 * (btile % modulus)) % 256);
                                        const lod = Math.max(0, zoom_ - 15);

                                        ((tileSupport, zoom, xtile, ytile, lod_, defaultColor_) => {
                                            const localUrl = self.layers[layerId].getLocalUrl(
                                                zoom, xtile, ytile);
                                            // console.log('localUrl:', localUrl);
                                            const url = self.layers[layerId].getUrl(
                                                zoom, xtile, ytile);

                                            self.loaders[layerId].load({
                                                    z: zoom,
                                                    x: xtile,
                                                    y: ytile
                                                },
                                                localUrl,
                                                url,
                                                tileMesh => {
                                                    tileSupport.add(tileMesh);
                                                    for (let i = tileMesh.children.length - 1; i >= 0; i--) {
                                                        let buildingMesh = tileMesh.children[i];
                                                        for (let j = buildingMesh.children.length - 1; j >= 0; j--) {
                                                            self.buildingObjects.push(buildingMesh.children[j]);
                                                        }
                                                    }
                                                    // self.buildingObjects.push(obj);
                                                    // self.buildingObjects.push(obj);
                                                    self.render();
                                                },
                                                () => {},
                                                () => {},
                                                lod_,
                                                defaultColor_);
                                        })(tileSupport, zoom_, (atile % modulus), (btile % modulus), lod, defaultColor);
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                }
            }
        }
        tileLoader.cancelOtherRequests(currentIds);
    };
    setCenter(lon, lat) {
        this.controls.setCenter(lon, lat);
    };
    setPosition(lon, lat, alti, phi, theta) {
        this.controls.setPosition(lon, lat, alti, phi, theta);
        // this.updateScene({
        //     'lon': this.lonStamp,
        //     'lat': this.latStamp,
        //     'alti': this.altitude
        // });
    };
}
World.ZOOM_FLAT = 13;
export default World;
