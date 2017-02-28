import State from './State';

class LocalLoadingState extends State {
    constructor(request) {
        super();
        this._request = request;
    }

    load() {
        throw new Error("You can't load a file that is being loaded already!");
    }

    progress(event) {
        // console.log('Getting local data in progress: ', this._request.localUrl);
        this._request.onProgress();
    }

    fail(event) {
        console.log('Fail to get local data at', this._request.localUrl);
        let myTile = this._request.tileCoord;
        console.log('mkdir -p buildingData/' + myTile.z + '/' + myTile.x + '; wget' + ' \'' + this._request.remoteUrl + '\' ' + '-O buildingData/' + myTile.z + '/' + myTile.x + '/' + myTile.y + '.json');
        this._request.setState(this._request.getReady4RemoteLoadState());
        this._request.load();
    }

    success(response) {
        console.log('Success in getting local data at', this._request.localUrl);
        this._request.onFinish(response);
        this._request.setState(this._request.getLoadedState());
    }
}

export default LocalLoadingState;
