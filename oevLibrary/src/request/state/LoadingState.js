import State from './State';

class LoadingState extends State {
    constructor(request) {
        super();
        this._request = request;
    }

    load() {
        throw new Error("You can't load a file that is being loaded already!");
    }

    progress(event) {
        // console.log('Load in progress!');
        // console.log('event:', event);
        this._request.onProgress();
        // this._request.setState(this._request.getLoadingState());
    }

    fail(event) {
        // console.log('Load has failed!');
        // console.log('state:', this._request.state);
        // console.log('event:', event);
        this._request.onFailure();
        this._request.setState(this._request.getLoadedFailedState());
    }

    finish(response) {
        // console.log('Load has finished!');
        // console.log('payload:', response);
        this._request.onFinish(response);
        this._request.setState(this._request.getLoadedState());
    }
}

export default LoadingState;
