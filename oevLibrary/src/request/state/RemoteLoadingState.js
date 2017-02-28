import State from './State';

class RemoteLoadingState extends State {
    constructor(request) {
        super();
        this._request = request;
    }

    load() {
        throw new Error("You can't load a file that is being loaded already!");
    }

    progress(event) {
        this._request.onProgress();
    }

    fail(event) {
		console.log('remote tile load failed:', this._request.tileCoord);
		console.log('remote tile load failed - remoteUrl:', this._request.remoteUrl);
        this._request.onFailure();
        this._request.setState(this._request.getLoadedFailedState());
    }

    success(response) {
        console.log('remote tile loaded:', this._request.tileCoord);
        // console.log('response:', response);
        this._request.onFinish(response);
        this._request.setState(this._request.getLoadedState());
    }
}

export default RemoteLoadingState;
