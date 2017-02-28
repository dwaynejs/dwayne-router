import { iterate } from './utils';
import { location } from './constants';

export default (decodeQuery) => {
  const {
    search: query,
    hash
  } = location;
  const params = {
    query: Object.create(null),
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

    param = decodeURIComponent(param);
    value = decodeQuery ? decodeURIComponent(value) : value;

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
