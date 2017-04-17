import { assign } from './utils';
import constructValidators from './constructValidators';
import getPath from './getPath';

class Route {
  constructor(options) {
    options = options || {};

    const {
      name,
      Block,
      path = '/',
      abstract = false,
      parent,
      params: paramsValidators,
      query,
      decodeQuery = true,
      encodeQuery = true,
      decodeParams = true,
      encodeParams = true
    } = options || {};
    const {
      url: relativeURL,
      path: relativePath,
      params
    } = getPath(path);
    const eventualParamsValidators = constructValidators(paramsValidators);
    const eventualQueryValidators = constructValidators(query);

    assign(this, {
      name,
      Block,
      parentName: parent,
      abstract: !!abstract,
      children: [],
      decodeParams: !!decodeParams,
      decodeQuery: !!decodeQuery,
      encodeParams: !!encodeParams,
      encodeQuery: !!encodeQuery,
      params,
      paramsValidators: eventualParamsValidators,
      queryValidators: eventualQueryValidators,
      relativePath,
      relativeURL
    });
  }
}

export default Route;
