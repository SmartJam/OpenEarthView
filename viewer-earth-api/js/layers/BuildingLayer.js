// world.addLayer(new OpenEarthView.Layer.OSM(
//     "OpenStreetMap", [
//         "http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
//         "http://b.tile.openstreetmap.org/${z}/${x}/${y}.png",
//         "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png"
//     ]));

OpenEarthView.Layer.Building = function(name, urls) {
    this.name = (name !== undefined) ? name : 'OpenEarthView';
    if (OpenEarthViewLayers.hasOwnProperty(name)) {
        console.err('Cannot register this already existing layer !');
        return;
    }
    OpenEarthViewLayers[name] = (urls !== undefined) ? urls : [
        'http://localhost:8081/3dtile?format=geojson&xtile=${x}&ytile=${y}&zoom=${z}'
    ];
};

OpenEarthView.Layer.Building.prototype = {
    constructor: OpenEarthView.Layer.Building,
    type: 'building',
    getName: function() {
        return this.name
    },
    getUrl: function(zoom, xtile, ytile, factor) {
        var scope = this;
        var urls = OpenEarthViewLayers[scope.name];
        var urlRandom = urls[
            Math.floor(Math.random() * urls.length)];
        // console.log('urlRandom:', urlRandom);
        // var url = urlRandom.replace(
        //     /(.*)\$\{z\}(.*)\$\{x\}(.*)\$\{y\}(.*)/,
        //     function replacer(match, p1, p2, p3, p4, offset, string) {
        //         // console.log("Match!");
        //         return p1 + zoom + p2 + xtile + p3 + ytile + p4;
        //     });
        var url = urlRandom.replace('${f}', factor);
        var url = url.replace('${z}', zoom);
        var url = url.replace('${x}', xtile);
        return url.replace('${y}', ytile);
        // return url;
    }
}
