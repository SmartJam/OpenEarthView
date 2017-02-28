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

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe
var THREE = require('THREE');
let instance = null;

// class Wall extends THREE.Object3D {
//
//   constructor(params) {
//     super();
//     this.add(this.drawMesh(params));
//     this.add(this.drawCollisionMesh(params));
//   }
//
//   // method
//   drawMesh(params) {
//     return new THREE.Mesh(geometry, material);
//   }
//
//   // getter
//   get material() {
//     return this.children[1].material;
//   }
//
//   ...
// }
let self;

class EarthControls extends THREE.EventDispatcher {
    // var scope = this;
    constructor(object, domElement, render, updateScene, coord, onSelectObject) {
        super();
        self = this;
        if (!instance) {
            instance = this;
        } else {
            return instance;
        }
        this.object = object;
        this.render = render;
        this.updateScene = updateScene;
        this.domElement = (domElement !== undefined) ? domElement : document;
        this.onSelectObject = onSelectObject;
        // this.selection = null;
        // Set to false to disable this control
        this.enabled = true;
        // "target" sets the location of focus, where the object orbits around
        this.target = new THREE.Vector3();
        // How far you can dolly in and out ( PerspectiveCamera only )
        // this.minDistance = 10;
        this.minDistance = 1;
        this.maxDistance = 20000000;
        // How far you can zoom in and out ( OrthographicCamera only )
        this.minZoom = 0;
        this.maxZoom = Infinity;
        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = 1.5; // radians
        // this.maxPolarAngle = 1.7; // radians

        // How far you can orbit horizontally, upper and lower limits.
        // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
        this.minAzimuthAngle = -Infinity; // radians
        this.maxAzimuthAngle = Infinity; // radians
        // this.minAzimuthAngle = -Math.PI/20; // radians
        // this.maxAzimuthAngle = +Math.PI/20; // radians

        // Set to true to enable damping (inertia)
        // If damping is enabled, you must call controls.update() in your animation loop
        this.enableDamping = false;
        this.dampingFactor = 0.25;
        // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
        // Set to false to disable zooming
        this.enableZoom = true;
        this.zoomSpeed = 1.0;
        // Set to false to disable rotating
        this.enableRotate = true;
        this.rotateSpeed = 1.0;
        // Set to false to disable panning
        this.enablePan = true;
        this.keyPanSpeed = 7.0; // pixels moved per arrow key push

        // // Le louvre
        // this.LONGITUDE_ORI = 2.33517;
        // this.LATITUDE_ORI = 48.86148;

        // UNESCO
        // this.LONGITUDE_ORI = 2.3057599523656336;
        // this.LATITUDE_ORI = 48.849568465379264;

        // this.LONGITUDE_ORI = 0;
        // this.LATITUDE_ORI = 0.00001;

        // // ESB
        // this.LONGITUDE_ORI = -73.98468017578125;
        // this.LATITUDE_ORI = 40.7477771608207;

        // COLISEO
        this.LONGITUDE_ORI = 12.492148216478085;
        this.LATITUDE_ORI = 41.89015670900311;

        // Set to true to automatically rotate around the target
        // If auto-rotate is enabled, you must call controls.update() in your animation loop
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60
        // Set to false to disable use of the keys
        this.enableKeys = true;
        // The four arrow keys
        this.keys = {
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            BOTTOM: 40
        };
        // Mouse buttons
        // this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };
        this.mouseButtons = {
            PAN: THREE.MOUSE.LEFT,
            ZOOM: THREE.MOUSE.MIDDLE,
            ORBIT: THREE.MOUSE.RIGHT
        };
        // for reset
        this.target0 = this.target.clone();
        this.position0 = this.object.position.clone();
        this.zoom0 = this.object.zoom;

        //
        // internals
        //

        // this.timer = setTimeout(function() {
        // 	this.render();
        // }, 0);
        this.startEvent = {
            type: 'start'
        };
        this.endEvent = {
            type: 'end'
        };

        this.state = EarthControls.STATE.NONE;

        // current position in spherical coordinates
        this.spherical = new THREE.Spherical();
        this.sphericalDelta = new THREE.Spherical();

        this.scale = 1;
        // var panOffset = new THREE.Vector3();
        this.longitude = this.LONGITUDE_ORI;
        this.latitude = this.LATITUDE_ORI;
        if (coord !== null) {
            this.longitude = (coord.hasOwnProperty('longitude')) ?
                coord.longitude : this.longitude;
            this.latitude = (coord.hasOwnProperty('latitude')) ?
                coord.latitude : this.latitude;
        }

        this.zoomChanged = false;

        this.rotateStart = new THREE.Vector2();
        this.rotateEnd = new THREE.Vector2();
        this.rotateDelta = new THREE.Vector2();

        this.panStart = new THREE.Vector2();
        this.panEnd = new THREE.Vector2();
        this.panDelta = new THREE.Vector2();

        this.dollyStart = new THREE.Vector2();
        this.dollyEnd = new THREE.Vector2();
        this.dollyDelta = new THREE.Vector2();

        this.domElement.addEventListener('contextmenu', this.onContextMenu, false);

        this.domElement.addEventListener('mousedown', this.onMouseDown, false);
        this.domElement.addEventListener('mousewheel', this.onMouseWheel, false);
        this.domElement.addEventListener('MozMousePixelScroll', this.onMouseWheel, false); // firefox

        this.domElement.addEventListener('touchstart', this.onTouchStart, false);
        this.domElement.addEventListener('touchend', this.onTouchEnd, false);
        this.domElement.addEventListener('touchmove', this.onTouchMove, false);

        this.domElement.addEventListener('dblclick', this.onDblClick, false);
        this.domElement.addEventListener('click', this.onClick, false);

        window.addEventListener('keydown', this.onKeyDown, false);

        // force an update at start
        this.update();
    }

    //
    // public methods
    //
    setCenter(lon, lat) {
        this.longitude = lon;
        this.latitude = lat;
        this.render();
		this.delayUpdateScene();
    }

    setPolarAngle(phi) {
        this.spherical.phi = phi;
        this.update();
        this.render();
		this.delayUpdateScene();
    }
    setAzimuthalAngle(theta) {
        this.spherical.theta = theta;
        this.update();
        this.render();
		this.delayUpdateScene();
    }
    setPosition(lon, lat, alti, phi, theta) {
        this.longitude = lon;
        this.latitude = lat;
        this.object.position.z = alti;
        // this.camera.position.z = alti;
        this.sphericalDelta.phi = phi;
        this.sphericalDelta.theta = theta;
        this.update();
        this.updateScene();
    }

    getPolarAngle() {
        return this.spherical.phi;
    }
    getAzimuthalAngle() {
        return this.spherical.theta;
    }

    reset() {
        this.target.copy(this.target0);
        this.object.position.copy(this.position0);
        this.object.zoom = this.zoom0;
        this.object.updateProjectionMatrix();
        this.dispatchEvent({
            type: 'change'
        });
        this.update();
        this.render();
		this.delayUpdateScene();
        this.state = EarthControls.STATE.NONE;
    }

    // setSelection(selection) {
    //         this.selection = selection;
    //     }
    // this method is exposed, but perhaps it would be better if we can make it private...
    update() {
        let offset = new THREE.Vector3();
        // so camera.up is the orbit axis
        let quat = new THREE.Quaternion().setFromUnitVectors(this.object.up, new THREE.Vector3(0, 1, 0));
        let quatInverse = quat.clone().inverse();
        let lastPosition = new THREE.Vector3();
        let lastQuaternion = new THREE.Quaternion();

        let position = this.object.position;
        offset.copy(position).sub(this.target);
        // rotate offset to "y-axis-is-up" space
        offset.applyQuaternion(quat);
        // angle from z-axis around y-axis
        this.spherical.setFromVector3(offset);
        if (this.autoRotate && this.state === EarthControls.STATE.NONE) {
            this.rotateLeft(this.getAutoRotationAngle());
        }
        this.spherical.theta += this.sphericalDelta.theta;
        this.spherical.phi += this.sphericalDelta.phi;
        // restrict theta to be between desired limits
        this.spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, this.spherical.theta));
        // restrict phi to be between desired limits
        this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
        this.spherical.makeSafe();
        this.spherical.radius *= this.scale;
        // restrict radius to be between desired limits
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
        // move target to panned location
        // scope.target.add(panOffset);
        offset.setFromSpherical(this.spherical);
        // rotate offset back to "camera-up-vector-is-up" space
        offset.applyQuaternion(quatInverse);
        position.copy(this.target).add(offset);
        this.object.lookAt(this.target);
        if (this.enableDamping === true) {
            this.sphericalDelta.theta *= (1 - this.dampingFactor);
            this.sphericalDelta.phi *= (1 - this.dampingFactor);
        } else {
            this.sphericalDelta.set(0, 0, 0);
        }
        this.scale = 1;

        // panOffset.set(0, 0, 0);
        // update condition is:
        // min(camera displacement, camera rotation in radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8
        if (this.zoomChanged ||
            lastPosition.distanceToSquared(this.object.position) > EarthControls.EPS ||
            8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EarthControls.EPS) {
            this.dispatchEvent({
                type: 'change'
            });
            lastPosition.copy(this.object.position);
            lastQuaternion.copy(this.object.quaternion);
            this.zoomChanged = false;
            return true;
        }
        return false;
    }

    dispose() {
        this.domElement.removeEventListener('contextmenu', this.onContextMenu, false);
        this.domElement.removeEventListener('mousedown', this.onMouseDown, false);
        this.domElement.removeEventListener('mousewheel', this.onMouseWheel, false);
        this.domElement.removeEventListener('MozMousePixelScroll', this.onMouseWheel, false); // firefox
        this.domElement.removeEventListener('touchstart', this.onTouchStart, false);
        this.domElement.removeEventListener('touchend', this.onTouchEnd, false);
        this.domElement.removeEventListener('touchmove', this.onTouchMove, false);
        document.removeEventListener('mousemove', this.onMouseMove, false);
        document.removeEventListener('mouseup', this.onMouseUp, false);
        document.removeEventListener('mouseout', this.onMouseUp, false);
        document.removeEventListener('dblclick', this.onDblClick, false);
        document.removeEventListener('click', this.onClick, false);
        window.removeEventListener('keydown', this.onKeyDown, false);

        //scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?
    };

    getAutoRotationAngle() {
        return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
    }

    getZoomScale() {
        return Math.pow(0.95, this.zoomSpeed);
    }

    rotateLeft(angle) {
        this.sphericalDelta.theta -= angle;
    }

    // this.rotateLeft = rotateLeft;

    rotateUp(angle) {
        this.sphericalDelta.phi -= angle;
    }

    panLeft(distance) {
        let R = EarthControls.R;
        let lonDelta = Math.cos(this.spherical.theta) * (distance / (1000 * R * Math.cos(this.latitude * Math.PI / 180))) * 180 / Math.PI;
        this.longitude -= lonDelta;
        let latDelta = -Math.sin(this.spherical.theta) * (distance / (R * 1000)) * 180 / Math.PI;
        if (this.latitude + latDelta < 80 && this.latitude + latDelta > -80) {
            this.latitude += latDelta;
            // console.log('latitude:', latitude)
        }
        // latitude = (latitude + 90) % 180 - 90;
        this.longitude = (this.longitude + 540) % 360 - 180;
        // console.log('lon:', this.longitude);
        // console.log('lat:', this.latitude);
    }

    getLongitude() {
        return this.longitude;
    }

    // var newLon = lonOri + (controls.target.x / (1000 * R * Math.cos(lat * Math.PI / 180))) * 180 / Math.PI;
    // var newLat = latOri + (controls.target.y / (1000 * R)) * 180 / Math.PI;

    panUp(distance) {
        let R = EarthControls.R;
        let lonDelta = Math.sin(this.spherical.theta) * (distance / (1000 * R * Math.cos(this.latitude * Math.PI / 180))) * 180 / Math.PI;
        this.longitude -= lonDelta;
        let latDelta = Math.cos(this.spherical.theta) * (distance / (1000 * R)) * 180 / Math.PI;
        if (this.latitude + latDelta < 80 && this.latitude + latDelta > -80) {
            this.latitude += latDelta;
        }
        // latitude = (latitude + 90) % 180 - 90;
        this.longitude = (this.longitude + 360) % 360;
        // console.log('lon:', this.longitude);
        // console.log('lat:', this.latitude);
    }

    getLatitude() {
        return this.latitude;
    }

    // deltaX and deltaY are in pixels; right and down are positive

    pan(deltaX, deltaY) {
        let offset = new THREE.Vector3();
        let element = this.domElement === document ? this.domElement.body : this.domElement;
        if (this.object instanceof THREE.PerspectiveCamera) {
            // perspective
            let position = this.object.position;
            offset.copy(position).sub(this.target);
            let targetDistance = offset.length();
            // half of the fov is center to top of screen
            targetDistance *= Math.tan((this.object.fov / 2) * Math.PI / 180.0);
            // we actually don't use screenWidth, since perspective camera is fixed to screen height
            this.panLeft(2 * deltaX * targetDistance / element.clientHeight);
            this.panUp(2 * deltaY * targetDistance / element.clientHeight);
        } else if (this.object instanceof THREE.OrthographicCamera) {
            // orthographic
            this.panLeft(deltaX * (this.object.right - this.object.left) / this.object.zoom / element.clientWidth, this.object.matrix);
            this.panUp(deltaY * (this.object.top - this.object.bottom) / this.object.zoom / element.clientHeight, this.object.matrix);
        } else {
            // camera neither orthographic nor perspective
            console.warn('WARNING: EarthControls.js encountered an unknown camera type - pan disabled.');
            this
                .enablePan = false;
        }
    }

    dollyIn(dollyScale) {
        if (this.object instanceof THREE.PerspectiveCamera) {
            this.scale /= dollyScale;
        } else if (this.object instanceof THREE.OrthographicCamera) {
            this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom * dollyScale));
            this.object.updateProjectionMatrix();
            this.zoomChanged = true;
        } else {
            console.warn('WARNING: EarthControls.js encountered an unknown camera type - dolly/zoom disabled.');
            this.enableZoom = false;
        }
    }

    dollyOut(dollyScale) {
        if (this.object instanceof THREE.PerspectiveCamera) {
            this.scale *= dollyScale;
        } else if (this.object instanceof THREE.OrthographicCamera) {
            this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / dollyScale));
            this.object.updateProjectionMatrix();
            this.zoomChanged = true;
        } else {
            console.warn('WARNING: EarthControls.js encountered an unknown camera type - dolly/zoom disabled.');
            this.enableZoom = false;
        }
    }

    //
    // event callbacks - update the object state
    //

    handleMouseDownRotate(event) {
        // console.log('handleMouseDownRotate');
        self.rotateStart.set(event.clientX, event.clientY);
    }

    handleMouseDownDolly(event) {
        // console.log('handleMouseDownDolly');
        self.dollyStart.set(event.clientX, event.clientY);
    }

    handleMouseDownPan(event) {
        // console.log('handleMouseDownPan');
        self.panStart.set(event.clientX, event.clientY);
    }

    handleMouseMoveRotate(event) {
        // console.log('handleMouseMoveRotate');
        self.rotateEnd.set(event.clientX, event.clientY);
        self.rotateDelta.subVectors(self.rotateEnd, self.rotateStart);
        let element = self.domElement === document ? self.domElement.body : self.domElement;
        // rotating across whole screen goes 360 degrees around
        self.rotateLeft(2 * Math.PI * self.rotateDelta.x / element.clientWidth * self.rotateSpeed);
        // rotating up and down along whole screen attempts to go 360, but limited to 180
        self.rotateUp(2 * Math.PI * self.rotateDelta.y / element.clientHeight * self.rotateSpeed);
        self.rotateStart.copy(self.rotateEnd);
        self.update();
        self.render();
        // self.delayUpdateScene();
    }

    delayUpdateScene() {
        // console.log('Reset timer.');
        clearTimeout(this.timer);
        this.timer = setTimeout(function() {
            // console.log('Render after delay.');
            self.updateScene();
        }, EarthControls.RENDER_DELAY);
    }

    handleMouseMoveDolly(event) {
        //console.log( 'handleMouseMoveDolly' );
        self.dollyEnd.set(event.clientX, event.clientY);
        self.dollyDelta.subVectors(self.dollyEnd, self.dollyStart);
        if (self.dollyDelta.y > 0) {
            self.dollyIn(self.getZoomScale());
        } else if (self.dollyDelta.y < 0) {
            self.dollyOut(self.getZoomScale());
        }
        self.dollyStart.copy(self.dollyEnd);
        self.update();
        self.render();
        self.delayUpdateScene();
    }

    handleMouseMovePan(event) {
        //console.log( 'handleMouseMovePan' );
        self.panEnd.set(event.clientX, event.clientY);
        self.panDelta.subVectors(self.panEnd, self.panStart);
        self.pan(self.panDelta.x, self.panDelta.y);
        self.panStart.copy(self.panEnd);
        self.update();
        self.render();
        self.delayUpdateScene();
    }

    handleMouseUp(event) {
        //console.log( 'handleMouseUp' );
    }

    handleClick(event) {
        this.onSelectObject(event);
    }

    handleDblClick(event) {
        // this.onSelectObject(event);
    }

    // // function onDocumentMouseDown(event) {
    //
    //     event.preventDefault();
    //
    //     mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    //     mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    //
    //     raycaster.setFromCamera(mouse, camera);
    //
    //     var intersects = raycaster.intersectObjects(objects);
    //
    //     if (intersects.length > 0) {
    //
    //         intersects[0].object.material.color.setHex(Math.random() * 0xffffff);
    //
    //         var particle = new THREE.Sprite(particleMaterial);
    //         particle.position.copy(intersects[0].point);
    //         particle.scale.x = particle.scale.y = 16;
    //         scene.add(particle);
    //
    //     }
    //
    //     /*
    //     // Parse all the faces
    //     for ( var i in intersects ) {
    //
    //     	intersects[ i ].face.material[ 0 ].color.setHex( Math.random() * 0xffffff | 0x80000000 );
    //
    //     }
    //     */
    // }

    handleMouseWheel(event) {
        //console.log( 'handleMouseWheel' );
        let delta = 0;
        if (event.wheelDelta !== undefined) {
            // WebKit / Opera / Explorer 9
            delta = event.wheelDelta;
        } else if (event.detail !== undefined) {
            // Firefox
            delta = -event.detail;
        }

        if (delta > 0) {
            self.dollyOut(self.getZoomScale());
        } else if (delta < 0) {
            self.dollyIn(self.getZoomScale());
        }
        self.update();
        self.render();
        self.delayUpdateScene();
    }

    handleKeyDown(event) {
        //console.log( 'handleKeyDown' );
        switch (event.keyCode) {
            case self.keys.UP:
                self.pan(0, self.keyPanSpeed);
                self.update();
                self.render();
                self.delayUpdateScene();
                break;
            case self.keys.BOTTOM:
                self.pan(0, -self.keyPanSpeed);
                self.update();
                self.render();
                self.delayUpdateScene();
                break;
            case self.keys.LEFT:
                self.pan(self.keyPanSpeed, 0);
                self.update();
                self.render();
                self.delayUpdateScene();
                break;
            case self.keys.RIGHT:
                self.pan(-self.keyPanSpeed, 0);
                self.update();
                self.render();
                self.delayUpdateScene();
                break;
        }
    }

    handleTouchStartRotate(event) {
        //console.log( 'handleTouchStartRotate' );
        self.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
    }

    handleTouchStartDolly(event) {
        //console.log( 'handleTouchStartDolly' );
        let dx = event.touches[0].pageX - event.touches[1].pageX;
        let dy = event.touches[0].pageY - event.touches[1].pageY;
        let distance = Math.sqrt(dx * dx + dy * dy);
        self.dollyStart.set(0, distance);
    }

    handleTouchStartPan(event) {
        //console.log( 'handleTouchStartPan' );
        self.panStart.set(event.touches[0].pageX, event.touches[0].pageY);
    }

    handleTouchMoveRotate(event) {
        //console.log( 'handleTouchMoveRotate' );
        self.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
        self.rotateDelta.subVectors(self.rotateEnd, self.rotateStart);
        let element = self.domElement === document ? self.domElement.body : self.domElement;
        // rotating across whole screen goes 360 degrees around
        self.rotateLeft(2 * Math.PI * self.rotateDelta.x / element.clientWidth * self.rotateSpeed);
        // rotating up and down along whole screen attempts to go 360, but limited to 180
        self.rotateUp(2 * Math.PI * self.rotateDelta.y / element.clientHeight * self.rotateSpeed);
        self.rotateStart.copy(self.rotateEnd);
        self.update();
        self.render();
        self.delayUpdateScene();
    }

    handleTouchMoveDolly(event) {
        //console.log( 'handleTouchMoveDolly' );
        let dx = event.touches[0].pageX - event.touches[1].pageX;
        let dy = event.touches[0].pageY - event.touches[1].pageY;
        let distance = Math.sqrt(dx * dx + dy * dy);
        self.dollyEnd.set(0, distance);
        self.dollyDelta.subVectors(self.dollyEnd, self.dollyStart);
        if (self.dollyDelta.y > 0) {
            self.dollyOut(self.getZoomScale());
        } else if (self.dollyDelta.y < 0) {
            self.dollyIn(self.getZoomScale());
        }

        self.dollyStart.copy(self.dollyEnd);
        self.update();
        self.render();
        self.delayUpdateScene();
    }

    handleTouchMovePan(event) {
        //console.log( 'handleTouchMovePan' );
        self.panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
        self.panDelta.subVectors(self.panEnd, self.panStart);
        self.pan(self.panDelta.x, self.panDelta.y);
        self.panStart.copy(self.panEnd);
        self.update();
        self.render();
        self.delayUpdateScene();
    }

    handleTouchEnd(event) {
        //console.log( 'handleTouchEnd' );
    }

    //
    // event handlers - FSM: listen for events and reset state
    //

    onMouseDown(event) {
        if (self.enabled === false) return;
        event.preventDefault();
        if (event.button === self.mouseButtons.ORBIT) {
            if (self.enableRotate === false) return;
            self.handleMouseDownRotate(event);
            self.state = EarthControls.STATE.ROTATE;
        } else if (event.button === self.mouseButtons.ZOOM) {
            if (self.enableZoom === false) return;
            self.handleMouseDownDolly(event);
            self.state = EarthControls.STATE.DOLLY;
        } else if (event.button === self.mouseButtons.PAN) {
            if (self.enablePan === false) return;
            self.handleMouseDownPan(event);
            self.state = EarthControls.STATE.PAN;
        }
        if (self.state !== EarthControls.STATE.NONE) {
            document.addEventListener('mousemove', self.onMouseMove, false);
            document.addEventListener('mouseup', self.onMouseUp, false);
            document.addEventListener('mouseout', self.onMouseUp, false);
            document.addEventListener('dblClick', self.onDblClick, false);
            document.addEventListener('click', self.onClick, false);
            self.dispatchEvent(self.startEvent);
        }
    }

    onMouseMove(event) {
        if (self.enabled === false) return;
        event.preventDefault();
        if (self.state === EarthControls.STATE.ROTATE) {
            if (self.enableRotate === false) return;
            self.handleMouseMoveRotate(event);
        } else if (self.state === EarthControls.STATE.DOLLY) {
            if (self.enableZoom === false) return;
            self.handleMouseMoveDolly(event);
        } else if (self.state === EarthControls.STATE.PAN) {
            if (self.enablePan === false) return;
            self.handleMouseMovePan(event);
        }
    }

    onMouseUp(event) {
        if (self.enabled === false) return;
        self.handleMouseUp(event);
        document.removeEventListener('mousemove', self.onMouseMove, false);
        document.removeEventListener('mouseup', self.onMouseUp, false);
        document.removeEventListener('mouseout', self.onMouseUp, false);
        document.removeEventListener('dblClick', self.onDblClick, false);
        document.removeEventListener('click', self.onClick, false);
        self.dispatchEvent(self.endEvent);
        self.state = EarthControls.STATE.NONE;
    }

    onDblClick(event) {
        if (self.enabled === false) return;
        self.handleDblClick(event);
        document.removeEventListener('mousemove', self.onMouseMove, false);
        document.removeEventListener('mouseup', self.onMouseUp, false);
        document.removeEventListener('mouseout', self.onMouseUp, false);
        document.removeEventListener('dblClick', self.onDblClick, false);
        document.removeEventListener('click', self.onClick, false);
        self.dispatchEvent(self.endEvent);
        self.state = EarthControls.STATE.NONE;
    }

    onClick(event) {
        if (self.enabled === false) return;
        self.handleClick(event);
        document.removeEventListener('mousemove', self.onMouseMove, false);
        document.removeEventListener('mouseup', self.onMouseUp, false);
        document.removeEventListener('mouseout', self.onMouseUp, false);
        document.removeEventListener('dblClick', self.onDblClick, false);
        document.removeEventListener('click', self.onClick, false);
        self.dispatchEvent(self.endEvent);
        self.state = EarthControls.STATE.NONE;
    }

    onMouseWheel(event) {
        if (self.enabled === false ||
            self.enableZoom === false ||
            (self.state !== EarthControls.STATE.NONE && self.state !== EarthControls.STATE.ROTATE)) return;
        event.preventDefault();
        event.stopPropagation();
        self.handleMouseWheel(event);
        self.dispatchEvent(self.startEvent); // not sure why these are here...
        self.dispatchEvent(self.endEvent);
    }

    onKeyDown(event) {
        if (self.enabled === false || self.enableKeys === false || self.enablePan === false) return;
        self.handleKeyDown(event);
    }

    onTouchStart(event) {
        if (self.enabled === false) return;
        switch (event.touches.length) {
            case 3: // one-fingered touch: rotate
                if (self.enableRotate === false) return;
                self.handleTouchStartRotate(event);
                self.state = EarthControls.STATE.TOUCH_ROTATE;
                break;
            case 2: // two-fingered touch: dolly
                if (self.enableZoom === false) return;
                self.handleTouchStartDolly(event);
                self.state = EarthControls.STATE.TOUCH_DOLLY;
                break;
            case 1: // three-fingered touch: pan
                if (self.enablePan === false) return;
                self.handleTouchStartPan(event);
                self.state = EarthControls.STATE.TOUCH_PAN;
                break;
            default:
                self.state = EarthControls.STATE.NONE;
        }
        if (self.state !== EarthControls.STATE.NONE) {
            self.dispatchEvent(self.startEvent);
        }
    }

    onTouchMove(event) {
        if (self.enabled === false) return;
        event.preventDefault();
        event.stopPropagation();
        switch (event.touches.length) {
            case 3: // one-fingered touch: rotate
                if (self.enableRotate === false) return;
                if (self.state !== EarthControls.STATE.TOUCH_ROTATE) return; // is this needed?...
                self.handleTouchMoveRotate(event);
                break;
            case 2: // two-fingered touch: dolly
                if (self.enableZoom === false) return;
                if (self.state !== EarthControls.STATE.TOUCH_DOLLY) return; // is this needed?...
                self.handleTouchMoveDolly(event);
                break;
            case 1: // three-fingered touch: pan
                if (self.enablePan === false) return;
                if (self.state !== EarthControls.STATE.TOUCH_PAN) return; // is this needed?...
                self.handleTouchMovePan(event);
                break;
            default:
                self.state = EarthControls.STATE.NONE;
        }
    }

    onTouchEnd(event) {
        if (self.enabled === false) return;
        self.handleTouchEnd(event);
        self.dispatchEvent(self.endEvent);
        self.state = EarthControls.STATE.NONE;
    }

    onContextMenu(event) {
        event.preventDefault();
    }

};

EarthControls.STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_DOLLY: 4,
    TOUCH_PAN: 5
};
EarthControls.EPS = 0.000001;
EarthControls.R = 6378.137;
EarthControls.changeEvent = {
    type: 'change'
};
// THREE.EarthControls.prototype = Object.create(THREE.EventDispatcher.prototype);
// THREE.EarthControls.prototype.constructor = THREE.EarthControls;

Object.defineProperties(EarthControls.prototype, {
    center: {
        get: function() {
            console.warn('THREE.EarthControls: .center has been renamed to .target');
            return this.target;
        }
    },
    // backward compatibility
    noZoom: {
        get: function() {
            console.warn('THREE.EarthControls: .noZoom has been deprecated. Use .enableZoom instead.');
            return !this.enableZoom;
        },
        set: function(value) {
            console.warn('THREE.EarthControls: .noZoom has been deprecated. Use .enableZoom instead.');
            this.enableZoom = !value;
        }
    },
    noRotate: {
        get: function() {
            console.warn('THREE.EarthControls: .noRotate has been deprecated. Use .enableRotate instead.');
            return !this.enableRotate;
        },
        set: function(value) {
            console.warn('THREE.EarthControls: .noRotate has been deprecated. Use .enableRotate instead.');
            this.enableRotate = !value;
        }
    },
    noPan: {
        get: function() {
            console.warn('THREE.EarthControls: .noPan has been deprecated. Use .enablePan instead.');
            return !this.enablePan;
        },
        set: function(value) {
            console.warn('THREE.EarthControls: .noPan has been deprecated. Use .enablePan instead.');
            this.enablePan = !value;
        }
    },
    noKeys: {
        get: function() {
            console.warn('THREE.EarthControls: .noKeys has been deprecated. Use .enableKeys instead.');
            return !this.enableKeys;
        },
        set: function(value) {
            console.warn('THREE.EarthControls: .noKeys has been deprecated. Use .enableKeys instead.');
            this.enableKeys = !value;
        }
    },
    staticMoving: {
        get: function() {
            console.warn('THREE.EarthControls: .staticMoving has been deprecated. Use .enableDamping instead.');
            return !this.constraint.enableDamping;
        },
        set: function(value) {
            console.warn('THREE.EarthControls: .staticMoving has been deprecated. Use .enableDamping instead.');
            this.constraint.enableDamping = !value;
        }
    },
    dynamicDampingFactor: {
        get: function() {
            console.warn('THREE.EarthControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
            return this.constraint.dampingFactor;
        },
        set: function(value) {
            console.warn('THREE.EarthControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
            this.constraint.dampingFactor = value;
        }
    }
});
EarthControls.RENDER_DELAY = 500;

export default EarthControls;

// export default function(object, domElement, render, coord) {
//     return new EarthControls(object, domElement, render, coord);
// };

// module.exports = THREE.EarthControls;
