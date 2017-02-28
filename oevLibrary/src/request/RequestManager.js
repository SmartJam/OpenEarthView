/*
Calls:

let requestManager = new RequestManager(loader, maxRequest);
requestManager.createRequest(z,x,y,lod);
requestManager.loadNext();
*/

var Request = require('./Request.js');
// var THREE = require('THREE');

class RequestManager {
    constructor(localLoader, remoteLoader, maxRequest) {
        this.localLoader = localLoader;
        this.remoteLoader = remoteLoader;
        this.jsonResponse = {};
        this.requests = {};
        this.aliveRequests = {};
        this.aliveRequestsCount = 0;
        this.requestsCount = 0;
        this.maxRequest = (maxRequest !== undefined) ? maxRequest : RequestManager.DEFAULT_MAX_REQUEST;
    }
    newRequest(tileId, localUrl, url, onLoad, parse) {
        let scope = this;
        let myUrl = new URL(url);
        let tilePath = myUrl.pathname + myUrl.search;

        if (this.jsonResponse.hasOwnProperty(tilePath)) {
            onLoad(parse(
                scope.jsonResponse[tilePath],
                tileId));
        } else if (!this.requests.hasOwnProperty(tilePath)) {
            this.requests[tilePath] =
                new Request(tileId, localUrl, this.localLoader, url, this.remoteLoader, parse,
                    (payload) => {
                        let myUrl = new URL(url);
                        let tilePath = myUrl.pathname + myUrl.search;
                        // console.log('myTile:', myTile);
                        // console.log('tilePath:', tilePath);
                        if (scope.aliveRequests.hasOwnProperty(tilePath)) {
                            delete scope.aliveRequests[tilePath];
                            scope.aliveRequestsCount--;
                            // console.log('aliveRequestsCount:', scope.aliveRequestsCount);
                            // console.log('payload:', payload);
                            scope.jsonResponse[tilePath] = (payload === '') ? {} : JSON.parse(payload);
                            onLoad(parse(scope.jsonResponse[tilePath], tileId));
                        }
                        scope.loadNext();
                    },
                    () => {},
                    () => {
                        let myUrl = new URL(url);
                        let tilePath = myUrl.pathname + myUrl.search;
                        if (scope.aliveRequests.hasOwnProperty(tilePath)) {
                            delete scope.aliveRequests[tilePath];
                            scope.aliveRequestsCount--;
                            // console.log('aliveRequestsCount:', scope.aliveRequestsCount);
                        }
                        scope.loadNext();
                    });
            this.requestsCount++;
            // console.log('requestsCount:', this.requestsCount);
            scope.loadNext();
        }
    }
    loadNext() {
        while (this.aliveRequestsCount < this.maxRequest && this.requestsCount > 0) {
            let tilePaths = Object.keys(this.requests);
            // console.log('tilePaths.length:', tilePaths.length);
            let tilePath = tilePaths[tilePaths.length - 1];
            // console.log('tilePath:', tilePath);
            if (this.aliveRequests.hasOwnProperty(tilePath)) {
				// Remove request from queue
				delete this.requests[tilePath];
				this.requestsCount--;
				// console.log('requestsCount:', this.requestsCount);
                continue;
            }
            this.aliveRequestsCount++;
            // console.log('aliveRequestsCount:', this.aliveRequestsCount);
            this.aliveRequests[tilePath] = this.requests[tilePath];
			// Remove request from queue
            let req = this.aliveRequests[tilePath];
            delete this.requests[tilePath];
            this.requestsCount--;
            // console.log('requestsCount:', this.requestsCount);
            req.load();
        }
    }
}
RequestManager.DEFAULT_MAX_REQUEST = 10;
// RequestManager.LOADING_MANAGER = THREE.DefaultLoadingManager;
export default RequestManager;
