class State {
    load() {
        throw new Error('This method must be overwritten!');
    }

    progress(event) {
        throw new Error('This method must be overwritten!');
    }

    fail(event) {
        throw new Error('This method must be overwritten!');
    }

    success(payload) {
        throw new Error('This method must be overwritten!');
    }

}

export default State;
