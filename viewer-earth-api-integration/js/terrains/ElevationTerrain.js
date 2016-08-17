OpenEarthView.Terrain.ElevationTerrain = function(name, urls, options) {
    this.name = (name !== undefined) ? name : 'OpenEarthView';
    if (OpenEarthViewTerrains.hasOwnProperty(name)) {
        console.err('Cannot register this already existing layer !');
        return;
    }
    OpenEarthViewTerrains[name] = (urls !== undefined) ? urls : [
        'http://localhost:8084/terrain?tile=${z},${x},${y},${lod}'
    ];
};

OpenEarthView.Terrain.ElevationTerrain.prototype = {
    constructor: OpenEarthView.Terrain.ElevationTerrain,
    type: 'terrain',
    getName: function() {
        return this.name
    },
    getUrl: function(zoom, xtile, ytile, lod) {
        var scope = this;
        var urls = OpenEarthViewTerrains[scope.name];
        var urlRandom = urls[Math.floor(Math.random() * urls.length)];
        var url = urlRandom.replace('${z}', zoom);
        url = url.replace('${x}', xtile);
        url = url.replace('${y}', ytile);
        return url.replace('${lod}', lod);
    }
}
