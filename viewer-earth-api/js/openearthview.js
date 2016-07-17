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
    var toolbox = OpenEarthView.toolbox;
    var tileLoader = new OpenEarthView.TileLoader();

    if (domElement === null) {
        alert('No domElement defined.');
        return;
    }
    this.layers = [];
    this.layers[0] = new OpenEarthView.Layer.OSM("defaultLayer");
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

    this.geojsonLoader = new THREE.GeojsonLoader();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000000);
    this.camera.up.set(0, 0, 1);

    this.domElement = document.getElementById(domElement);
    // console.log('container.clientWidth:', container.clientWidth)
    // console.log('container.clientHeight:', container.clientHeight)
    // document.body.appendChild(scope.canvas);

    // var background = document.createElement('Background');
    // background.setAttribute('groundColor', '0.972 0.835 0.666');
    // background.setAttribute('skyAngle', '1.309 1.571');
    // background.setAttribute('skyColor', '0.0 0.2 0.7 0.0 0.5 1.0 1.0 1.0 1.0');
    // scene.appendChild(background);
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', 'openearthviewcanvas');
    this.domElement.appendChild(scope.canvas);

    this.renderer = new THREE.WebGLRenderer({
        canvas: scope.canvas
    });
    scope.canvas.width = scope.canvas.clientWidth;
    scope.canvas.height = scope.canvas.clientHeight;
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

    this.earth = new THREE.Object3D(); //create an empty container
    this.earth.position.set(0, 0, -R * 1000);
    this.scene.add(this.earth);

    this.light = new THREE.DirectionalLight(0xffffff, 1);
    this.light.position.set(10000, 15000, 20000);
    this.scene.add(this.light);

    document.addEventListener("keydown", scope.onDocumentKeyDown, false);
    this.camera.position.z = this.altitude;

    // this.updateSceneLazy();

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

    // var canvas = document.getElementById('world');
    // this.canvas.addEventListener('resize', scope.onWindowResize, false);
    window.addEventListener('resize', function() {
        // console.log('coucou !!!');
        console.log('scope.domElement.clientWidth:', scope.domElement.clientWidth);
        var width = scope.domElement.clientWidth;
        var height = scope.domElement.clientHeight;
        scope.renderer.setViewport(0, 0, width, scope.canvas.height);
        scope.renderer.setSize(width, height);
        scope.camera.aspect = width / height;
        scope.camera.updateProjectionMatrix();
        scope.render();
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
    //     scope.renderer.setSize(scope.canvas.clientWidth, scope.canvas.clientHeight);
    //     scope.camera.aspect = scope.canvas.clientWidth / scope.canvas.clientHeight;
    //     scope.camera.updateProjectionMatrix();
    //
    //     // renderer.setSize(window.innerWidth, window.innerHeight);
    //     // render();
    // }
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
        // console.log('position.lon:', position.lon);
        // console.log('position.lat:', position.lat);
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
        for (var zoom_ = Math.max(scope.zoom, scope.ZOOM_MIN); zoom_ > Math.max(scope.zoom - scope.ZOOM_SHIFT_SIZE, scope.ZOOM_MIN); zoom_--) {
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
                var lon1 = toolbox.tile2long(atile, zoom_);
                var lon2 = toolbox.tile2long(atile + 1, zoom_);
                var lon = (lon1 + lon2) / 2;
                for (var btile = minYtile; btile <= maxYtile; btile++) {
                    var lat1 = toolbox.tile2lat(btile, zoom_);
                    var lat2 = toolbox.tile2lat(btile + 1, zoom_);
                    var lat = (lat1 + lat2) / 2;
                    var widthUp = toolbox.measure(lat1, lon1, lat1, lon2);
                    var widthDown = toolbox.measure(lat2, lon1, lat2, lon2);
                    var widthSide = toolbox.measure(lat1, lon1, lat2, lon1);
                    var id = 'z_' + zoom_ + '_' + atile + "_" + btile;
                    for (var zzz = 1; zzz <= 2; zzz++) {
                        var idNext = 'z_' + (zoom_ - zzz) + '_' + Math.floor(atile / Math.pow(2, zzz)) + "_" + Math.floor(btile / Math.pow(2, zzz));
                        tiles[idNext] = {};
                    }
                    if (!tiles.hasOwnProperty(id)) {

                        for (var layerIdx = 0; layerIdx < scope.layers.length; layerIdx++) {
                            // console.log('layerIdx:', layerIdx);

                            if (zoom_ < scope.ZOOM_FLAT) {
                                var tileMesh;
                                var tileEarth = new THREE.Object3D(); //create an empty container
                                tileEarth.rotation.set(0, (lon1 + 180) * Math.PI / 180, 0);
                                scope.tileGroup[zShift].add(tileEarth);
                                tileMesh = toolbox.getTileMesh(R, zoom_, btile, Math.max(9 - zoom_, 0));
                                tileEarth.add(tileMesh);
                            } else {
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

                                var geometry = new THREE.ShapeGeometry(tileShape);
                                toolbox.assignUVs(geometry);
                                var tileSupport = new THREE.Object3D(); //create an empty container
                                tileSupport.position.set(xTileShift * widthUp, -yTileShift * widthSide, 0);
                                oriGround.add(tileSupport);

                                var tileMesh = new THREE.Mesh(geometry);
                                tileSupport.add(tileMesh)
                                    // if (zoom_ >= 19 && atile == xtile_ && btile == ytile) {
                            }
                            (function(tileMesh, zoom, xtile, ytile, layerIdx) {
                                var url = scope.layers[layerIdx].getUrl(
                                    zoom,
                                    ((zoom > 0) ? (xtile % Math.pow(2, zoom)) : 0),
                                    ((zoom > 0) ? (ytile % Math.pow(2, zoom)) : 0));
                                // console.log('url:', url);
                                // var tileUrls = [
                                //     "http://a.tile.openstreetmap.org/",
                                //     "http://b.tile.openstreetmap.org/",
                                //     "http://c.tile.openstreetmap.org/"
                                // ]
                                // var urlRandom = tileUrls[
                                //     Math.floor(Math.random() * tileUrls.length)];
                                // var url = urlRandom +
                                //     zoom + '/' +
                                //     ((zoom > 0) ? (xtile % Math.pow(2, zoom)) : 0) + '/' +
                                //     ((zoom > 0) ? (ytile % Math.pow(2, zoom)) : 0) + '.png';
                                tileLoader.tileFactory(
                                    url,
                                    zoom,
                                    xtile,
                                    ytile,
                                    function(texture) {
                                        tileMesh.material = new THREE.MeshBasicMaterial({
                                            map: texture,
                                            transparent: true,
                                            opacity: 1/scope.layers.length
                                        });
                                        scope.render();
                                    },
                                    scope.layers[layerIdx].getName()
                                );
                            })(tileMesh, zoom_, atile % modulus, btile % modulus, layerIdx);

                            var id = 'tile' + zoom_ + '_' + (atile % modulus) + '_' + (btile % modulus) + '_' + scope.layers[layerIdx].getName();
                            console.log('id:', id);
                            currentIds[id] = {};
                        }

                        if (scope.zoom >= 18 && zoom_ >= scope.zoom - 1) {
                            // var rColor = ((53 * (atile % modulus)) % 256).toString(16);
                            // console.log('rColor:', rColor);

                            var defaultColor =
                                ((13 * scope.zoom) % 256) * 65536 +
                                ((53 * (atile % modulus)) % 256) * 256 +
                                ((97 * (btile % modulus)) % 256);
                            // var defaultColor = 0xeeeeee;
                            // console.log('Define defaultColor:', defaultColor);
                            var lod = Math.max(0, zoom_ - 14);
                            (function(earth, myTile, zoom, xtile, ytile, lod, defaultColor) {
                                var url = 'http://localhost:8081/3dtile?format=geojson&xtile=' + xtile + '&ytile=' + ytile + '&zoom=' + zoom;
                                scope.geojsonLoader.load(
                                    url,
                                    function(obj) {
                                        myTile.add(obj);
                                        scope.render();
                                    },
                                    function() {},
                                    function() {},
                                    lod,
                                    defaultColor);
                            })(scope.earth, tileSupport, zoom_, (atile % modulus), (btile % modulus), lod, defaultColor);
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
    this.addLayer = function(openEarthViewLayer) {
        console.log('Add layer:', openEarthViewLayer.getName());
        if (scope.layers.length === 1 && scope.layers[0].getName() === "defaultLayer") {
            scope.layers.pop();
        }
        scope.layers[scope.layers.length] = openEarthViewLayer;
    }
}
