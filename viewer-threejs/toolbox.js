window.onload = function() {

    var body = document.body;

    var aScene = document.createElement('a-scene');

    var aEntity = document.createElement('a-entity');
    aEntity.setAttribute('position', '0.8 10 0');
    aEntity.setAttribute('rotation', '-90');
    var aEntityCamera = document.createElement('a-entity');
    aEntityCamera.setAttribute('camera', '');
    aEntityCamera.setAttribute('looks-controls', '');
    // aEntityCamera.setAttribute('wasd-controls', '');
    aEntityCamera.setAttribute('keyboard-controls', '');

    aEntity.appendChild(aEntityCamera);
    aScene.appendChild(aEntity);

    var aPlane = document.createElement('a-plane');
    aPlane.setAttribute('rotation', '-90 0 0');
    aPlane.setAttribute('width', 10);
    aPlane.setAttribute('height', 10);
    // aPlane.setAttribute('color', '#7BC8A4');
    aPlane.setAttribute('src', 'http://a.tile.openstreetmap.org/18/134118/95589.png');
    aScene.appendChild(aPlane);

    body.appendChild(aScene);



    // var body = document.body;
    // var aScene = document.createElement('a-scene');
    // // var aAssets = document.createElement('a-assets');
    // // var imgWorld = document.createElement('img');
    // // imgWorld.id = 'world';
    // // imgTile.src = 'resources/world/Stellar_density_map.png';
    // // var imgTile = document.createElement('img');
    // // imgTile.id = 'ground';
    // // imgTile.src = 'http://a.tile.openstreetmap.org/18/134118/95589.png';
    // // aAssets.appendChild(imgWorld);
    // // aAssets.appendChild(imgTile);
    //
    // var aEntity = document.createElement('a-entity');
    // aEntity.position = "0.8 10 0"
    // aEntity.rotation = "-90"
    // var aEntityCamera = document.createElement('a-entity');
    // aEntityCamera.camera = null;
    // aEntityCamera.setAttribute('looks-controls', '');
    // aEntityCamera.setAttribute('wasd-controls', '');
    // aEntity.appendChild(aEntityCamera);
    //
    // var aSky = document.createElement('a-sky');
    // aSky.src = 'resources/world/Stellar_density_map.png'
    // var aPlane = document.createElement('a-plane');
    // aPlane.rotation = '-90 0 0';
    // aPlane.width = '10';
    // aPlane.height = '10';
    // aPlane.src = 'http://a.tile.openstreetmap.org/18/134118/95589.png';
    //
    // aScene.appendChild(aEntity);
    // aScene.appendChild(aSky);
    // aScene.appendChild(aPlane);
    //
    // body.appendChild(aScene);
}


// TOOLBOX //
function getSearchParameters() {
    var prmstr = window.location.search.substr(1);
    return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray(prmstr) {
    var params = {};
    var prmarr = prmstr.split("&");
    for (var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = tmparr[1];
    }
    return params;
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
