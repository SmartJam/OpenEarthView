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

OpenEarthView = {};
OpenEarthView.World = function(domElement) {
    var scope = this;

    // LAYERS
    this.layers = {};
    this.addLayer = function(openEarthViewLayer) {
        console.log('Add layer:', openEarthViewLayer.getName());
        if (scope.layers.hasOwnProperty("defaultLayer")) {
            delete scope.layers["defaultLayer"];
        }
        scope.layers[openEarthViewLayer.getName()] = openEarthViewLayer;
        // for (var xtile = 0; xtile < 4; xtile++) {
        //     for (var ytile = 0; ytile < 4; ytile++) {
        //         if (openEarthViewLayer.type === 'tile') {
        //             tileLoader.tileFactory(
        //                 openEarthViewLayer.getUrl(2, xtile, ytile),
        //                 2,
        //                 xtile,
        //                 ytile,
        //                 function(texture) {
        //                     // Do nothing
        //                 }
        //             );
        //         }
        //     }
        // }
        tileLoader.tileFactory(openEarthViewLayer.getUrl(0, 0, 0), 0, 0, 0);
    }
    this.terrains = {};
    this.terrains["defaultTerrain"] = new OpenEarthView.Terrain.FlatTerrain("FlatTerrain");

    this.addTerrain = function(openEarthViewTerrain) {
        console.log('Add terrain:', openEarthViewTerrain.getName());
        if (scope.terrains.hasOwnProperty("defaultTerrain")) {
            delete scope.terrains["defaultTerrain"];
        }
        scope.terrains[openEarthViewTerrain.getName()] = openEarthViewTerrain;
    }

    var toolbox = OpenEarthView.toolbox;
    var tileLoader = new OpenEarthView.TileLoader();

    if (domElement === null) {
        alert('No domElement defined.');
        return;
    }

    this.ZOOM_SHIFT_SIZE = 4;
    this.ZOOM_MIN = 1;
    this.MAX_TILEMESH = 400;
    this.ZOOM_FLAT = 13;
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

    this.geojsonLoader = THREE.GeojsonLoader.getSingleton();

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000000);
    this.camera.up.set(0, 0, 1);

    this.domElement = document.getElementById(domElement);

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', 'openearthviewcanvas');
    this.domElement.appendChild(scope.canvas);

    this.renderer = new THREE.WebGLRenderer({
        canvas: scope.canvas
    });
    scope.canvas.width = scope.canvas.clientWidth;
    scope.canvas.height = scope.canvas.clientHeight;
    //
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

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

    this.earth = new THREE.Object3D(); //create an empty container
    this.earth.position.set(0, 0, -R * 1000);
    this.scene.add(this.earth);

    var light1 = new THREE.DirectionalLight(0xf0f0e0, 1);
    light1.position.set(10000, 0, 100000);
    var light2 = new THREE.DirectionalLight(0xf0f0e0, 1);
    light2.position.set(-5000, 8700, 10000);
    var light3 = new THREE.DirectionalLight(0xffffe0, 1);
    light3.position.set(-5000, -8700, 1000);
    this.scene.add(light1);
    this.scene.add(light2);
    this.scene.add(light3);

    document.addEventListener("keydown", scope.onDocumentKeyDown, false);
    this.camera.position.z = this.altitude;

    this.goUpdateSceneLazy = function() {
        scope.updateSceneLazy();
    }

    this.controls = new THREE.EarthControls(
        scope.camera,
        scope.renderer.domElement,
        scope.goUpdateSceneLazy, {
            longitude: scope.LONGITUDE_ORI,
            latitude: scope.LATITUDE_ORI
        }
    );

    window.addEventListener('resize', function() {
        var width = scope.domElement.clientWidth;
        var height = scope.domElement.clientHeight;
        scope.renderer.setViewport(0, 0, width, scope.canvas.height);
        scope.renderer.setSize(width, height);
        scope.camera.aspect = width / height;
        scope.camera.updateProjectionMatrix();
        scope.render();
    }, false);

    this.render = function() {
        scope.renderer.render(scope.scene, scope.camera);
    }

    this.updateSceneLazy = function() {
        // requestAnimationFrame(render);
        ////////////////////////////////////////////////////////////
        var oldZoom = scope.zoom;
        var dist = new THREE.Vector3().copy(scope.controls.object.position).sub(scope.controls.target).length();
        var zoom__ = Math.floor(Math.max(Math.min(Math.floor(27 - Math.log2(dist)), 19), 1));
        if (zoom__ > scope.ZOOM_MIN) {
            scope.zoom = zoom__;
        }

        if (scope.lonStamp != scope.controls.getLongitude() ||
            scope.latStamp != scope.controls.getLatitude()) {
            scope.lonStamp = scope.controls.getLongitude();
            scope.latStamp = scope.controls.getLatitude();
            scope.earth.rotation.set(
                scope.controls.getLatitude() * Math.PI / 180,
                (-scope.controls.getLongitude()) * Math.PI / 180,
                0);
            var oldXtile = scope.xtile;
            var oldYtile = scope.ytile;
            scope.xtile = toolbox.long2tile(scope.lonStamp, scope.zoom);
            scope.ytile = toolbox.lat2tile(scope.latStamp, scope.zoom);

            if (Math.abs(oldXtile - scope.xtile) >= 1 ||
                Math.abs(oldYtile - scope.ytile) >= 1) {
                updateScene({
                    'lon': scope.lonStamp,
                    'lat': scope.latStamp,
                    'alti': scope.altitude
                });
            }
        } else if (Math.abs(scope.zoom - oldZoom) >= 1) {
            updateScene({
                'lon': scope.lonStamp,
                'lat': scope.latStamp,
                'alti': scope.altitude
            });
        }
        ////////////////////////////////////////////////////////////
        scope.renderer.render(scope.scene, scope.camera);
    };


    function updateScene(position) {
        scope.xtile = toolbox.long2tile(position.lon, scope.zoom);
        scope.ytile = toolbox.lat2tile(position.lat, scope.zoom);

        var tiles = {};
        var nextMinXtile, nextMaxXtile;

        scope.earth.remove(scope.tileGroups);
        scope.tileGroups = new THREE.Object3D();
        scope.earth.add(scope.tileGroups);
        var oriGround = new THREE.Object3D();
        if (scope.zoom >= scope.ZOOM_FLAT) {
            var xtileOri = toolbox.long2tile(position.lon, scope.ZOOM_FLAT);
            var ytileOri = toolbox.lat2tile(position.lat, scope.ZOOM_FLAT);
            var lonOri = toolbox.tile2long(xtileOri, scope.ZOOM_FLAT);
            var latOri = toolbox.tile2lat(ytileOri, scope.ZOOM_FLAT);

            // 3 - ground position
            oriGround.position.set(0, 0, scope.R * 1000);
            // 2 - Latitude rotation
            var oriLatRot = new THREE.Object3D();
            oriLatRot.rotation.set((-latOri) * Math.PI / 180, 0, 0);
            oriLatRot.add(oriGround);
            // 1 - Longitude rotation
            var oriLonRot = new THREE.Object3D();
            oriLonRot.rotation.set(0, lonOri * Math.PI / 180, 0);
            oriLonRot.add(oriLatRot);

            scope.tileGroups.add(oriLonRot);
        }

        var currentIds = {};
        console.log('position:', JSON.stringify({
            zoom: scope.zoom,
            xtile: scope.xtile,
            ytile: scope.ytile
        }));
        var zoomMax = Math.max(scope.zoom, scope.ZOOM_MIN);
        var zoomMin = Math.max(scope.zoom - scope.ZOOM_SHIFT_SIZE, scope.ZOOM_MIN);
        for (var zoom_ = zoomMax; zoom_ > zoomMin; zoom_--) {
            var zShift = scope.zoom - zoom_;
            scope.tileGroup[zShift] = new THREE.Object3D(); //create an empty container
            scope.tileGroups.add(scope.tileGroup[zShift]);

            if (zoom_ < 0 && zShift > 0) {
                continue;
            }
            var factor = Math.pow(2, zShift);
            var xtile_ = Math.floor(scope.xtile / factor);
            var ytile_ = Math.floor(scope.ytile / factor);
            if (scope.zoom < 8 && zoom_ < 6) {
                var size = 2;
            } else if (zoom_ < 19) {
                var size = 2;
            } else {
                size = 2;
            }
            var minXtile = Math.max(0, Math.floor((xtile_ - (Math.pow(2, (size - 1)) - 1)) / 2) * 2);
            var maxXtile = Math.floor((xtile_ + (Math.pow(2, (size - 1)) - 1)) / 2) * 2 + 1;
            var minYtile = Math.max(0, Math.floor((ytile_ - (Math.pow(2, (size - 1)) - 1)) / 2) * 2);
            var maxYtile = Math.floor((ytile_ + (Math.pow(2, (size - 1)) - 1)) / 2) * 2 + 1;
            var modulus = (zoom_ > 0) ? Math.pow(2, zoom_) : 0;
            for (var atile = minXtile; atile <= maxXtile; atile++) {
                for (var btile = minYtile; btile <= maxYtile; btile++) {
                    var id = '' + zoom_ + '/' + (atile % modulus) + '/' + (btile % modulus);
                    for (var zzz = 1; zzz <= 2; zzz++) {
                        var zoom__ = (zoom_ - zzz);
                        var xtile__ = Math.floor((atile % modulus) / Math.pow(2, zzz));
                        var ytile__ = Math.floor((btile % modulus) / Math.pow(2, zzz));
                        var idNext = '' + zoom__ + '/' + xtile__ + '/' + ytile__;
                        tiles[idNext] = {};
                        for (var terrainId in scope.terrains) {
                            switch (scope.terrains[terrainId].type) {
                                case 'tile':
                                    tileLoader.tileFactory(
                                        scope.terrains[terrainId].getUrl(zoom__, xtile__, ytile__),
                                        zoom__,
                                        xtile__,
                                        ytile__);
                                    break;
                            }
                        }
                    }
                    if (!tiles.hasOwnProperty(id)) {
                        var tileSupport = new THREE.Object3D(); //create an empty container
                        var tileMesh = new THREE.Mesh();
                        tileSupport.add(tileMesh);
                        // tileMesh.position.set(0, 0, -10);
                        if (zoom_ < scope.ZOOM_FLAT) {
                            var tileEarth = new THREE.Object3D(); //create an empty container
                            tileEarth.rotation.set(0, (toolbox.tile2long(atile, zoom_) + 180) * Math.PI / 180, 0);
                            scope.tileGroup[zShift].add(tileEarth);
                            tileMesh = toolbox.getTileMesh(R, zoom_, btile, Math.max(9 - zoom_, 0));
                            tileEarth.add(tileMesh);
                        } else {
                            for (var terrainId in scope.terrains) {
                                if (!scope.terrains.hasOwnProperty(terrainId)) {
                                    continue;
                                }
                                switch (scope.terrains[terrainId].type) {
                                    case 'terrain':
                                        (function(tileSupport, tileMesh, zoom, xtile, ytile) {

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
                                            var xTileShift = (atile - xtile_) + (xtile_ % Math.pow(2, zoom_ - scope.ZOOM_FLAT));
                                            var yTileShift = (btile - ytile_) + (ytile_ % Math.pow(2, zoom_ - scope.ZOOM_FLAT));
                                            var xA = 0;
                                            var xB = xA;
                                            var xC = widthUp;
                                            var xD = xC;
                                            var yA = -widthSide;
                                            var yB = 0;
                                            var yC = yB;
                                            var yD = yA;
                                            tileShape.moveTo(xA, yA);
                                            tileShape.lineTo(xB, yB);
                                            tileShape.lineTo(xC, yC);
                                            tileShape.lineTo(xD, yD);
                                            tileShape.lineTo(xA, yA);

                                            tileSupport.position.set(xTileShift * widthUp, -yTileShift * widthSide, 0);
                                            oriGround.add(tileSupport);

                                            var geometry = new THREE.ShapeGeometry(tileShape);
                                            toolbox.assignUVs(geometry);
                                            tileMesh.geometry = geometry;

                                        })(tileSupport, tileMesh, zoom_, atile % modulus, btile % modulus);

                                        break;
                                }
                            }
                        }
                        for (var layerId in scope.layers) {
                            if (!scope.layers.hasOwnProperty(layerId)) {
                                continue;
                            }
                            switch (scope.layers[layerId].type) {
                                case 'tile':
                                    tileMesh.material = new THREE.MeshBasicMaterial({
                                        transparent: ((scope.layers[layerId].opacity === 1) ? false : true),
                                        opacity: scope.layers[layerId].opacity
                                    });
                                    scope.render();

                                    // (function(zoom, xtile, ytile) {
                                    //     if (zoom_ === Math.max(zoomMin - 5, 0) && xtile === scope.xtile && ytile === scope.ytile) {
                                    //         tileLoader.tileFactory(
                                    //             scope.layers[layerId].getUrl(zoom_, xtile, ytile),
                                    //             zoom_,
                                    //             xtile,
                                    //             ytile
                                    //         );
                                    //     }
                                    // })(zoom_, atile % modulus, btile % modulus);
                                    //
                                    //
                                    //
                                    tileLoader.tilePreload(
                                        zoom_,
                                        atile % modulus,
                                        btile % modulus,
                                        function(texture) {
                                            tileMesh.material.map = texture;
                                            tileMesh.material.needsUpdate = true;
                                            scope.render();
                                        }
                                    );

                                    (function(tileMesh, zoom, xtile, ytile, layerId) {
                                        var url = scope.layers[layerId].getUrl(
                                            zoom,
                                            ((zoom > 0) ? (xtile % Math.pow(2, zoom)) : 0),
                                            ((zoom > 0) ? (ytile % Math.pow(2, zoom)) : 0));
                                        tileLoader.tileFactory(
                                            url,
                                            zoom,
                                            xtile,
                                            ytile,
                                            function(texture) {
                                                tileMesh.material.map = texture;
                                                tileMesh.material.needsUpdate = true;
                                                scope.render();
                                            }
                                        );
                                        var tilePath = zoom + '/' + xtile + '/' + ytile;
                                        currentIds[tilePath] = {};
                                    })(tileMesh, zoom_, atile % modulus, btile % modulus, layerId);
                                    break;
                                case 'building':
                                    if (scope.zoom >= 17 && zoom_ >= Math.max(scope.zoom - 1, scope.layers[layerId].minZoom)) {
                                        var id = 'tile_' + zoom_ + '_' + (atile % modulus) + '_' + (btile % modulus) + '_' + scope.layers[layerId].getName();
                                        var defaultColor =
                                            ((13 * scope.zoom) % 256) * 65536 +
                                            ((53 * (atile % modulus)) % 256) * 256 +
                                            ((97 * (btile % modulus)) % 256);
                                        var lod = Math.max(0, zoom_ - 15);
                                        (function(tileSupport, zoom, xtile, ytile, lod, defaultColor) {
                                            var url = scope.layers[layerId].getUrl(
                                                zoom, xtile, ytile);
                                            scope.geojsonLoader.load({
                                                    z: zoom,
                                                    x: xtile,
                                                    y: ytile
                                                },
                                                url,
                                                function(obj) {
                                                    tileSupport.add(obj);
                                                    scope.render();
                                                },
                                                function() {},
                                                function() {},
                                                lod,
                                                defaultColor);

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
    }
    this.setCenter = function(lon, lat) {
        scope.controls.setCenter(lon, lat);
    }
}
