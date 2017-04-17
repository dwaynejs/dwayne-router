import {
  isArray,
  isObject,
  iterate,
  map,
  replaceString
} from './utils';

const emptyArray = [];

export default (url, params, query, hash, encodeParams, encodeQuery) => {
  iterate(params, (value, param) => {
    url = replaceString(url, `:${ param }`, encode(value, encodeParams));
  });

  const queryParams = querySwitcher(query, '');

  if (queryParams.length) {
    const prefix = url.indexOf('?') === -1 ? '?' : '&';
    const postfix = map(queryParams, ({ param, value }) => (
      `${ encode(param) }=${ encode(value, encodeQuery) }`
    )).join('&');

    url += prefix + postfix;
  }

  return `${ url }${ hash ? `#${ hash }` : '' }`;
};

function encode(string, isNeededToEncode) {
  return isNeededToEncode
    ? encodeURIComponent(string)
    : string;
}

function querySwitcher(query, prefix) {
  /* eslint indent: 0 */
  switch (true) {
    case isArray(query): {
      const queryParams = [];

      iterate(query, (value) => {
        if (isObject(value)) {
          return queryParams.push(...querySwitcher(value, `${ prefix }[]`));
        }

        queryParams.push({
          param: `${ prefix }[]`,
          value
        });
      });

      return queryParams;
    }

    case isObject(query): {
      const queryParams = [];

      iterate(query, (value, param) => {
        if (isObject(value)) {
          queryParams.push(...querySwitcher(value, prefix ? `${ prefix }[${ param }]` : param));

          return;
        }

        queryParams.push({
          param: prefix ? `${ prefix }[${ param }]` : param,
          value: String(value)
        });
      });

      return queryParams;
    }

    default: {
      return emptyArray;
    }
  }
}
