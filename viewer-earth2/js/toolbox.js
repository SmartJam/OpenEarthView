// TOOLBOX //
assignUVs = function(geometry) {

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

}

function textureFactory(zoom_, xtile_, ytile_, onLoaded) {
    var id = 'tile_' + zoom_ + '_' + xtile_ + '_' + ytile_;
    if (!(textures.hasOwnProperty(id))) {
        var url = TILE_PROVIDER + '/' +
            zoom_ + '/' +
            ((zoom_ > 0) ? (xtile_ % Math.pow(2, zoom_)) : 0) + '/' +
            ((zoom_ > 0) ? (ytile_ % Math.pow(2, zoom_)) : 0) + '.png';
        textureLoader.load(url,
            function(texture) {
                // var material = new THREE.MeshBasicMaterial({
                //     map: texture
                // });
                textures[id] = texture;
                onLoaded(textures[id]);
                textureQueue.push(id);
                if (textureQueue.length > MAX_TILEMESH) {
                    delete textures[textureQueue.shift()];
                }
            }
            // function(xhr) {
            //     console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            // },
            // function(xhr) {
            //     console.log('An error happened');
            // }
        );
    } else {
        onLoaded(textures[id]);
    }
}

function getSearchParameters() {
    var prmstr = window.location.search.substr(1);
    return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function long2tile(lon, zoom) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
}

function lat2tile(lat, zoom) {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
}

function tile2long(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
}

function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

function measure(lat1, lon1, lat2, lon2) { // generally used geo measurement function
    // var R = 6378.137; // Radius of earth in KM
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000; // meters
}

function lonOffsetMeter2lon(lon, lat, x) {
    return x / (R * Math.cos(lat)) + lon;
}

function latOffsetMeter2lat(lat, y) {
    var R = 6378.137;
    return (y / R) + lat;
}
