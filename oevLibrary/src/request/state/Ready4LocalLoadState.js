import State from './State';

class Ready4LocalLoadState extends State {
    constructor(request) {
        super();
        this._request = request;
    }

    load() {
        // console.log('Ready4LocalLoad.');
        let scope = this;
        // console.log('Start Load!');
        let url;
        let loader;
        if (this._request.localUrl !== undefined) {
            // console.log('localUrl:', this._request.localUrl);
            url = this._request.localUrl;
            loader = this._request.localLoader;
            this._request.setState(this._request.getLocalLoadingState());
        } else {
            console.log('localUrl undefined');
            url = this._request.url;
            loader = this._request.remoteLoader;
            this._request.setState(this._request.getRemoteLoadingState());
        }
        // load: function ( url, onLoad(response), onProgress(event), onError(event) ) {
        loader.load(
            url,
            (response) => {
                scope._request.state.success(response);
            },
            (event) => {
                this._request.state.progress(event);
            },
            (event) => {
                this._request.state.fail(event);
            });
    }

    progress(event) {
        throw new Error("You can't make progress a not started load!");
    }

    fail(event) {
        throw new Error("A load can't fail if is not started!");
    }

    success(response) {
        throw new Error("A load can't success if is not started!");
    }
}

export default Ready4LocalLoadState;
