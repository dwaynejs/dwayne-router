import {
  iterate,
  create,
  decode
} from './utils';
import { location } from './constants';

export default () => {
  const {
    search: query,
    hash
  } = location;
  const params = {
    query: create(null),
    hash: hash.replace(/^#/, '')
  };

  if (!query || query === '?') {
    return params;
  }

  const queryParams = query
    .replace(/^\?/, '')
    .split('&');

  iterate(queryParams, (rawParam) => {
    let [param, value = ''] = rawParam.split('=');

    param = decode(param);
    value = decode(value);

    if (!/^[^[\]]+/.test(param)) {
      return;
    }

    let paramName;
    let paramObject = params.query;
    const paramNames = param.match(/^[^[\]]+|\[[^[\]]*]/g);

    iterate(paramNames, (name) => {
      if (name.indexOf('[')) {
        paramName = name;

        return;
      }

      name = name.slice(1, -1);

      paramObject = paramObject[paramName] = paramObject[paramName] || (name ? {} : []);
      paramName = name || paramObject.length;
    });

    paramObject[paramName] = value;
  });

  return params;
};
