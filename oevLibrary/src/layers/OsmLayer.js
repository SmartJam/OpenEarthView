// world.addLayer(new OpenEarthView.Layer.OSM(
//     "OpenStreetMap", [
//         "http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
//         "http://b.tile.openstreetmap.org/${z}/${x}/${y}.png",
//         "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png"
//     ]));

class OSM {
    constructor(name, urls) {
        this.name = (name !== undefined) ? name : 'OpenStreetMap';
        // if (OpenEarthViewLayers.hasOwnProperty(name)) {
        //     console.err('Cannot register this already existing layer !');
        //     return;
        // }
        this.urls = (urls !== undefined) ? urls : [
            'http://a.tile.openstreetmap.org/${z}/${x}/${y}.png',
            'http://b.tile.openstreetmap.org/${z}/${x}/${y}.png',
            'http://c.tile.openstreetmap.org/${z}/${x}/${y}.png'
        ];
        this.type = OSM.type;
    }
    getName() {
        return this.name;
    }
    getUrl(zoom, xtile, ytile) {
        let urlRandom = this.urls[
            Math.floor(Math.random() * this.urls.length)];
        let url = urlRandom.replace('${z}', zoom);
        url = url.replace('${x}', xtile);
        return url.replace('${y}', ytile);
    }
}
OSM.type = 'tile';
OSM.opacity = 1;
export default OSM;
