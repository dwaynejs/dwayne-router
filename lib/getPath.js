import {
  isFunction,
  isRegExp,
  isString,
  isNil,
  escapeRegExp,
  iterate
} from './utils';

export default (path) => {
  const params = Object.create(null);

  /* eslint indent: 0 */
  switch (true) {
    case isRegExp(path): {
      return {
        path,
        url: path,
        params
      };
    }

    case isNil(path): {
      return {
        path: '/',
        url: '/',
        params
      };
    }

    case isFunction(path): {
      return {
        path,
        url: path,
        params
      };
    }

    case isString(path): {
      if (path.indexOf('/')) {
        throw new Error('If route path is a string it must start with "/"! (at route)');
      }

      const index = path.indexOf('?');
      let newURL = '';
      let newPath = '';
      let paramsCount = 0;
      const pathParts = path
        .slice(0, index === -1 ? path.length : index)
        .replace(/^\/|\/$/g, '')
        .split(/\//);

      iterate(pathParts, (part, i, array) => {
        if (!part && array.length > 1) {
          throw new Error('If route path is a string it must not contain "//" or end with "/"! (at makeRoute)');
        }

        const index = part.indexOf(':');

        if (index > 0) {
          throw new Error('If route path is a string resource part must be either a string or an URL parameter! (at makeRoute)');
        }

        if (index === -1) {
          newURL += `/${ part }`;
          newPath += `/${ escapeRegExp(part) }`;

          return;
        }

        const name = part.slice(1);

        params[name] = paramsCount++;
        newURL += `/:${ name }`;
        newPath += '/([^/]*)';
      });

      return {
        path: newPath,
        url: newURL,
        params
      };
    }

    default: {
      throw new Error('State path must be a string, a regular expression, null or undefined! (at route)');
    }
  }
};
