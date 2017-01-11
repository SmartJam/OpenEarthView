
var toolbox = OpenEarthView.toolbox;

OpenEarthView.Layer.OverpassBuilding = function(name, urls, options) {
    this.name = (name !== undefined) ? name : 'Overpass';
    this.minZoom = 17;
    if (options !== undefined) {
        this.minZoom = (options.minZoom !== undefined) ? options.minZoom : 18;
        // console.log('minZoom: ' + this.minZoom);
    }
    if (OpenEarthViewLayers.hasOwnProperty(name)) {
        console.err('Cannot register this already existing layer !');
        return;
    }
    OpenEarthViewLayers[name] = (urls !== undefined) ? urls : [
        'http://overpass-api.de/api/interpreter'
    ];
};

OpenEarthView.Layer.OverpassBuilding.prototype = {
    constructor: OpenEarthView.Layer.Building,
    type: 'overpassBuilding',
    getName: function() {
        return this.name
    },
    getUrl: function(zoom, xtile, ytile) {
        var scope = this;
        var urls = OpenEarthViewLayers[scope.name];
        var urlRandom = urls[
            Math.floor(Math.random() * urls.length)];

        // Process GPS bounds
        minLon = toolbox.tile2long(xtile, zoom);
        maxLon = toolbox.tile2long(xtile + 1, zoom);
        minLat = toolbox.tile2lat(ytile + 1, zoom);
        maxLat = toolbox.tile2lat(ytile, zoom);

        var url = urlRandom;
        url = url + '?data=[out:json];' +
            '((relation["building"](' + minLat + ',' + minLon + ',' + maxLat + ',' + maxLon + ');>;);' +
            '(way["building"](' + minLat + ',' + minLon + ',' + maxLat + ',' + maxLon + ');>;););' +
            'out center;'
        return url;
    }
}
