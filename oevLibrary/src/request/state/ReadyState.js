import State from './State';

class ReadyState extends State {
    constructor(request) {
        super();
        this._request = request;
    }

    load() {
        let scope = this;
        // console.log('Start Load!');
        let url = this._request.url;
        this._request.setState(this._request.getLoadingState());
        console.log('url:', url);
        // load: function ( url, onLoad(response), onProgress(event), onError(event) ) {
        this._request.loader.load(
            url,
            (response) => {
                scope._request.state.finish(response);
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

    finish(response) {
        throw new Error("A load can't finish if is not started!");
    }
}

export default ReadyState;
