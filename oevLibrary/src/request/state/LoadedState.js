import State from './State';

class LoadedState extends State {
    constructor(request) {
        super();
        this._request = request;
    }

    load() {
        throw new Error("You can't reload a loaded file!");
    }

    progress() {
        throw new Error("You can't make progress a loaded file!");
    }

    fail() {
        throw new Error("A loaded file can't fail!");
    }

    success(payload) {
        throw new Error("A loaded file can't success itself!");
    }
}

export default LoadedState;
