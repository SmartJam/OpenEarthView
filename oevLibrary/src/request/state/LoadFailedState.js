import State from './State';

class LoadFailedState extends State {
    constructor(request) {
        super();
        this._request = request;
    }

    load() {
        throw new Error("You can't reload a failed load!");
    }

    progress(event) {
        throw new Error("You can't make progress a failed load!");
    }

    fail(event) {
        throw new Error("A failed load can't fail itself!");
    }

    success(response) {
        // console.log('payload:', response);
        throw new Error('A failed load cannot success!');
    }
}

export default LoadFailedState;
