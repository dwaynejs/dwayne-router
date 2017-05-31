import { location } from './constants';

class RouteParams {
  constructor(options) {
    this.name = options.name;
    this.params = options.params;
    this.additionalParams = options.additionalParams;
    this.query = options.query;
    this.hash = options.hash;
    this.host = location.host;
    this.hostname = location.hostname;
    this.href = location.href;
    this.origin = location.origin;
    this.pathname = location.pathname;
    this.port = location.port;
    this.protocol = location.protocol;
    this.search = location.search;
  }
}

export default RouteParams;
