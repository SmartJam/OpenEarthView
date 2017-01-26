// var OpenEarthView = require("../openearthview.js");
// OpenEarthView.Terrain = require("./Terrain.js");

// this.terrains["defaultTerrain"] = new OpenEarthView.Terrain.FlatTerrain("FlatTerrain");
// // this.addTerrain("defaultTerrain", new OpenEarthView.Terrain.FlatTerrain("FlatTerrain"));
// // world.addTerrain(new OpenEarthView.Terrain.FlatTerrain("FlatTerrain"));

export default class {
    constructor(name, urls, options) {
        this.type = 'terrain';
        this.name = (name !== undefined) ? name : 'OpenEarthView';
        // if (OpenEarthView.Terrains.hasOwnProperty(name)) {
        //     console.err('Cannot register this already existing layer !');
        //     return;
        // }
        // OpenEarthView.Terrains[name] = [];
    }
    getName() {
        return this.name;
    }
    getUrl(zoom, xtile, ytile) {
        return undefined;
    }
}
