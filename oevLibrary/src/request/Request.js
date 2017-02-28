// Help from https://github.com/tcorral/Design-Patterns-in-Javascript/blob/es6/State/1/scripts/main.js

var Ready4LocalLoadState = require('./state/Ready4LocalLoadState.js');
var LocalLoadingState = require('./state/LocalLoadingState.js');
var Ready4RemoteLoadState = require('./state/Ready4RemoteLoadState.js');
var RemoteLoadingState = require('./state/RemoteLoadingState.js');
var LoadedState = require('./state/LoadedState.js');
var LoadFailedState = require('./state/LoadFailedState.js');

class Request {
    constructor(myTile, localUrl, localLoader, remoteUrl, remoteLoader, parse, onLoad, onProgress, onFailure) {
		// console.log('tile:', myTile);
		// console.log('mkdir -p buildingData/' + myTile.z + '/' + myTile.x + '; wget' + ' \'' + remoteUrl + '\' ' + '-O buildingData/' + myTile.z + '/' + myTile.x + '/' + myTile.y + '.json');
        this.tileCoord = myTile;
        this.localUrl = localUrl;
        this.localLoader = localLoader;
        this.remoteUrl = remoteUrl;
        // console.log('Request.remoteUrl:', remoteUrl);
        this.remoteLoader = remoteLoader;
        this.parse = parse;
        this.onFinish = onLoad;
        this.onProgress = onProgress;
        this.onFailure = onFailure;
        this.state = new Ready4LocalLoadState(this);
    }

    setState(state) {
        // console.log('state:', state.constructor.name);
        this.state = state;
    }

    load() {
        this.state.load();
    }

    progress(event) {
        this.state.progress(event);
    }

    success(response) {
        this.state.success(response);
    }

    fail(event) {
        this.state.fail(event);
    }

    getReady4LocalLoadState() {
        return new Ready4LocalLoadState(this);
    }

    getReady4RemoteLoadState() {
        return new Ready4RemoteLoadState(this);
    }

    getLocalLoadingState() {
        return new LocalLoadingState(this);
    }

    getRemoteLoadingState() {
        return new RemoteLoadingState(this);
    }

    getLoadedState() {
        return new LoadedState(this);
    }

    getLoadedFailedState() {
        return new LoadFailedState(this);
    }
}

export default Request;
