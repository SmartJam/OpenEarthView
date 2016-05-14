/**
 * @author mrdoob / http://mrdoob.com/
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
        }, onProgress, onError);
    },

    setCrossOrigin: function(value) {

        this.crossOrigin = value;

    },

    parse: function(json) {
        console.log('parsing...');
        var scene = new THREE.Scene();

        // California
        var californiaPts = [];
        californiaPts.push(new THREE.Vector2(610, 320));
        californiaPts.push(new THREE.Vector2(450, 300));
        californiaPts.push(new THREE.Vector2(392, 392));
        californiaPts.push(new THREE.Vector2(266, 438));
        californiaPts.push(new THREE.Vector2(190, 570));
        californiaPts.push(new THREE.Vector2(190, 600));
        californiaPts.push(new THREE.Vector2(160, 620));
        californiaPts.push(new THREE.Vector2(160, 650));
        californiaPts.push(new THREE.Vector2(180, 640));
        californiaPts.push(new THREE.Vector2(165, 680));
        californiaPts.push(new THREE.Vector2(150, 670));
        californiaPts.push(new THREE.Vector2(90, 737));
        californiaPts.push(new THREE.Vector2(80, 795));
        californiaPts.push(new THREE.Vector2(50, 835));
        californiaPts.push(new THREE.Vector2(64, 870));
        californiaPts.push(new THREE.Vector2(60, 945));
        californiaPts.push(new THREE.Vector2(300, 945));
        californiaPts.push(new THREE.Vector2(300, 743));
        californiaPts.push(new THREE.Vector2(600, 473));
        californiaPts.push(new THREE.Vector2(626, 425));
        californiaPts.push(new THREE.Vector2(600, 370));
        californiaPts.push(new THREE.Vector2(610, 320));
        for (var i = 0; i < californiaPts.length; i++) {
            californiaPts[i].multiplyScalar(0.25);
        }
        var californiaShape = new THREE.Shape(californiaPts);

        // addShape( californiaShape,  extrudeSettings, 0xf08000, -300, -100, 0, 0, 0, 0, 1 );
        // function addShape( shape, extrudeSettings, color, x, y, z, rx, ry, rz, s ) {

        // extruded shape
        var extrudeSettings = {
            amount: 8,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 2,
            bevelSize: 1,
            bevelThickness: 1
        };
        var geometry = new THREE.ExtrudeGeometry(californiaShape, extrudeSettings);

        var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
            color: 0xf08000
        }));
        mesh.position.set(30, 10, 0);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(1, 1, 1);
        scene.add(mesh);

        return scene;
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
