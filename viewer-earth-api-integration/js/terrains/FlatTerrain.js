// this.terrains["defaultTerrain"] = new OpenEarthView.Terrain.FlatTerrain("FlatTerrain");
// // this.addTerrain("defaultTerrain", new OpenEarthView.Terrain.FlatTerrain("FlatTerrain"));
// // world.addTerrain(new OpenEarthView.Terrain.FlatTerrain("FlatTerrain"));


OpenEarthView.Terrain.FlatTerrain = function(name, urls, options) {
    this.name = (name !== undefined) ? name : 'OpenEarthView';
    if (OpenEarthViewTerrains.hasOwnProperty(name)) {
        console.err('Cannot register this already existing layer !');
        return;
    }
    OpenEarthViewTerrains[name] = [];
};

OpenEarthView.Terrain.FlatTerrain.prototype = {
    constructor: OpenEarthView.Terrain.FlatTerrain,
    type: 'terrain',
    getName: function() {
        return this.name
    },
    getUrl: function(zoom, xtile, ytile) {
        return undefined;
    }
}
