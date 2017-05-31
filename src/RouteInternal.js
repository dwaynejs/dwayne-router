import { Children } from 'dwayne';
import {
  assign,
  isRegExp,
  isFunction,
  keysCount,
  get,
  create
} from './utils';
import constructValidators from './constructValidators';
import getPath from './getPath';
import { Route } from './blocks/Route';

class RouteInternal {
  constructor(options) {
    const {
      name,
      block,
      path,
      abstract = false,
      parent,
      router: {
        _handleTrailingSlash
      },
      params: paramsValidators,
      query: queryValidators
    } = options;
    const {
      url: relativeURL,
      path: relativePath,
      params
    } = getPath(path, parent);
    const eventualParamsValidators = constructValidators(paramsValidators);
    const eventualQueryValidators = constructValidators(queryValidators);
    const isRegExpPath = isRegExp(relativePath);
    const isDynamicPath = isRegExpPath || isFunction(relativePath);

    this.name = name;
    this.parent = parent;
    this.block = block || html`<Children/>`;
    this.abstract = !!abstract;
    this.handleTrailingSlash = !!get(options, 'handleTrailingSlash', _handleTrailingSlash);
    this.params = assign({}, parent && parent.params, params);
    this.paramsCount = keysCount(this.params);
    this.paramsValidators = assign(create(null), parent && parent.paramsValidators, eventualParamsValidators);
    this.query = queryValidators;
    this.queryValidators = assign(create(null), parent && parent.queryValidators, eventualQueryValidators);
    this.children = [];
    this.relativePath = relativePath;
    this.relativeURL = relativeURL;
    this.childBlocks = [];

    let proto = this;
    let newPath = (
      parent
        ? parent.relativePath
        : ''
      ).replace(/\/$/, '') + (
      isDynamicPath
        ? ''
        : relativePath
    );
    let newURL = (
      parent
        ? parent.relativeURL
        : ''
      ).replace(/\/$/, '') + (
      isDynamicPath
        ? ''
        : relativeURL
    );

    while (proto = proto.parent) {
      proto.children.push(this);
    }

    newPath = new RegExp(
      isDynamicPath
        ? `^${ newPath }(/[\\s\\S]+)$`
        : `^${ newPath + (!abstract && this.handleTrailingSlash ? '\\/?' : '') }$`
    );
    newURL = isDynamicPath
      ? newPath
      : newURL;

    this.url = newURL;
    this.path = newPath;

    if (isDynamicPath) {
      let matchFunc = relativePath;

      if (isRegExpPath) {
        matchFunc = (path) => {
          const match = path.match(relativePath);

          return match && match.slice(1);
        };
      }

      this.pathMatch = (path) => {
        const match = path.match(newPath);

        if (!match) {
          return;
        }

        const rest = match[this.paramsCount + 1];

        return matchFunc(rest);
      };
    } else {
      this.pathMatch = (path) => (
        path.match(newPath)
      );
    }

    if (parent) {
      parent.childBlocks.push({
        type: Route,
        args: { name }
      });
    }
  }
}

export default RouteInternal;
