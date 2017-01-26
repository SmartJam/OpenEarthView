// export default class OpenEarthView {
//     constructor() {
//         this._name = 'OpenEarthView';
//     }
//     get name() {
//         return this._name;
//     }
// }

var THREE = require('THREE');
THREE.EarthControls = require('./controls/EarthControls.js');

export default {
    World: require('./world.js'),
    toolbox: require('./toolbox.js'),
    Layer: {
        // OverpassBuilding: require('./layers/OverpassBuildingLayer.js'),
        OSM: require('./layers/OsmLayer.js')
    }
    // EarthControls: require('./controls/EarthControls_function.js')
    // EarthControls: require('./controls/EarthControls.js')
};
// OpenEarthView.TileLoader = require("./loaders/TileLoader.js");
