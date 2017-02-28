import State from './State';

class Ready4RemoteLoadState extends State {
    constructor(request) {
        super();
        this._request = request;
    }

    load() {
        // console.log('Loading remote data:', this._request.remoteUrl);
        let scope = this;
        // console.log('Start Load!');
        let url = this._request.remoteUrl;
        let loader = this._request.remoteLoader;
        this._request.setState(this._request.getRemoteLoadingState());
        // load: function ( url, onLoad(response), onProgress(event), onError(event) ) {
        loader.load(
            url,
            (response) => {
                scope._request.state.success(response);
            },
            (event) => {
                scope._request.state.progress(event);
            },
            (event) => {
                scope._request.state.fail(event);
            });
    }

    progress(event) {
        throw new Error("You can't make progress a failed load!");
    }

    fail(event) {
        throw new Error("A failed load can't fail itself!");
    }

    success(response) {
        console.log('Remote data loaded.');
        throw new Error('A failed load cannot success!');
    }
}

export default Ready4RemoteLoadState;
