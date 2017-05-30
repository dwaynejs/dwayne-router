import {
  isFunction,
  isRegExp,
  isString,
  isNil,
  escapeRegExp,
  iterate,
  keysCount
} from './utils';

export default (path, parent) => {
  const params = {};

  switch (true) {
    case isRegExp(path): {
      return {
        path,
        url: path,
        params
      };
    }

    case isNil(path) || path === '/': {
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
        throw new Error('If route path is a string it must start with "/"! (at new Route)');
      }

      let newURL = '';
      let newPath = '';
      let paramsCount = parent
        ? keysCount(parent.params) + 1
        : 1;
      const pathParts = path.split(/\//);

      iterate(pathParts, (part, i) => {
        if (!part) {
          if (i > 0) {
            throw new Error('If route path is a string it must not contain "//" or end with "/"! (at new Route)');
          }

          return;
        }

        const index = part.indexOf(':');

        if (index === -1) {
          newURL += `/${ part }`;
          newPath += `/${ escapeRegExp(part) }`;

          return;
        }

        const before = part.slice(0, index);
        const name = part.slice(index + 1);

        params[name] = paramsCount++;
        newURL += `/${ before }:${ name }`;
        newPath += `/${ before }([^/]*)`;
      });

      return {
        path: newPath,
        url: newURL,
        params
      };
    }

    default: {
      throw new Error('Route path must be a string, regexp, function, null or undefined! (at new Route)');
    }
  }
};
