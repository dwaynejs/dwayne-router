import {
  isArray,
  isObject,
  iterate,
  replaceString,
  encode
} from './utils';

export default (url, params, query, hash) => {
  iterate(params, (value, param) => {
    url = replaceString(url, `:${ param }`, encode(value));
  });

  const queryParams = querySwitcher(query, '');

  if (queryParams.length) {
    const postfix = queryParams
      .map(({ param, value }) => (
        `${ param }=${ encode(value) }`
      ))
      .join('&');

    url += `?${ postfix }`;
  }

  return `${ url }${ hash ? `#${ hash }` : '' }`;
};

function querySwitcher(query, prefix) {
  const queryParams = [];

  if (isArray(query)) {
    iterate(query, (value) => {
      if (isObject(value)) {
        queryParams.push(...querySwitcher(value, `${ prefix }[]`));
      } else {
        queryParams.push({
          param: `${ prefix }[]`,
          value
        });
      }
    });
  } else {
    iterate(query, (value, param) => {
      if (isObject(value)) {
        queryParams.push(...querySwitcher(value, prefix ? `${ prefix }[${ encode(param) }]` : param));
      } else {
        queryParams.push({
          param: prefix ? `${ prefix }[${ encode(param) }]` : param,
          value: String(value)
        });
      }
    });
  }

  return queryParams;
}
