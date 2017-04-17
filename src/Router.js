import {
  isEmpty,
  isFunction,
  isRegExp,
  assign,
  find,
  iterate,
  keysCount,
  allKeysCount,
  setProto
} from './utils';
import Route from './Route';
import {
  location,
  initialURL
} from './constants';
import constructURL from './constructURL';
import resolveURL from './resolveURL';

let pushed;

class Router {
  _initialized = false;
  _routes = [];
  _currentRoutes = [];
  _subscribers = [];

  constructor(name) {
    this.name = name;
    this._baseRoute = new Route({
      router: name,
      abstract: true
    });
  }

  _changeHistory(url, push) {
    try {
      if (push) {
        history.pushState(null, '', url);
      } else {
        history.replaceState(null, '', url);
      }

      pushed = true;
    } catch (err) {
      location.href = url;
    }
  }

  _changeRoute() {
    const route = this._findRouteByURL();
    let currentRoute;
    let currentRouteParams;

    if (route) {
      ({
        route: currentRoute,
        ...currentRouteParams
      } = route);
      assign(currentRouteParams, {
        name: currentRoute.name,
        host: location.host,
        hostname: location.hostname,
        href: location.href,
        origin: location.origin,
        pathname: location.pathname,
        port: location.port,
        protocol: location.protocol,
        search: location.search
      });
    } else {
      if (this._redirectRoute) {
        const {
          url,
          encodeParams,
          encodeQuery,
          redirectRouteIsNeededToPush
        } = this._redirectRoute;

        return this._forward(constructURL(url, {}, {}, '', encodeParams, encodeQuery), redirectRouteIsNeededToPush);
      }

      currentRoute = null;
      currentRouteParams = null;
    }

    const {
      _baseRoute,
      _currentRoutes,
      _subscribers
    } = this;
    const routesToLeave = [];
    const routesToLoad = [];
    let parent;

    while (_currentRoutes.length && !parent) {
      const route = _currentRoutes.pop();

      if (route.children.indexOf(currentRoute) === -1 && route !== currentRoute) {
        routesToLeave.push(route);
      } else {
        _currentRoutes.push(route);
        parent = route;
      }
    }

    if (currentRoute) {
      let currentParent = currentRoute;

      while (currentParent !== parent && currentParent !== _baseRoute) {
        routesToLoad.unshift(currentParent);
        currentParent = currentParent.parent;
      }

      _currentRoutes.push(...routesToLoad);
    }

    this._currentRouteParams = currentRouteParams;

    iterate(routesToLeave, ({ name }) => {
      iterate(_subscribers, ({ name: Name, callback }) => {
        if (name === Name) {
          callback(false);
        }
      });
    });

    iterate(_currentRoutes, ({ name }) => {
      iterate(_subscribers, ({ name: Name, callback }) => {
        if (name === Name) {
          callback(true);
        }
      });
    });
  }

  _findRouteByName(name) {
    return find(this._routes, ({ name: Name }) => name && name === Name);
  }

  _findRouteByURL() {
    const { _routes } = this;
    const pathname = location.pathname || '/';
    const search = location.search || '';
    let urlParams;

    find(_routes, (route) => {
      if (route.abstract) {
        return;
      }

      const {
        url: routeURL,
        pathMatch,
        params,
        paramsValidators,
        queryValidators,
        decodeParams,
        decodeQuery
      } = route;
      const resolved = resolveURL(decodeQuery);
      const {
        query,
        hash
      } = resolved;
      const eventualParams = {};
      const match = pathMatch(
        (pathname.replace(/\/$/, '') || '/') +
        (isRegExp(routeURL) ? search : '')
      );

      if (!match) {
        return;
      }

      /* eslint guard-for-in: 0 */
      for (const param in queryValidators) {
        if (!query[param] || !queryValidators[param](query[param])) {
          return;
        }
      }

      match.shift();

      for (const param in params) {
        const value = match[params[param]];
        const validator = paramsValidators[param];
        const eventualValue = decodeParams
          ? decodeURIComponent(value)
          : value;

        if (!validator(eventualValue)) {
          return;
        }

        eventualParams[param] = eventualValue;
      }

      urlParams = {
        route,
        params: eventualParams,
        query: { ...query },
        hash
      };

      return true;
    });

    if (urlParams) {
      return urlParams;
    }

    const { _defaultRoute } = this;

    if (!_defaultRoute) {
      return;
    }

    const {
      query,
      hash
    } = resolveURL(_defaultRoute.decodeQuery);

    return {
      route: _defaultRoute,
      params: {},
      query: { ...query },
      hash
    };
  }

  _forward(url, push) {
    this._changeHistory(url, push);
    this._changeRoute();
  }

  _init() {
    if (this._initialized) {
      return;
    }

    this._initialized = true;

    const {
      _baseRoute,
      _routes,
      _defaultRoute,
      _redirectRoute,
      _rootRoute,
      name: routerName
    } = this;

    if (!_rootRoute) {
      throw new Error(`No root route for "${ routerName }" router was provided! (at Router#_init)`);
    }

    iterate(_routes, (route) => {
      const {
        parentName,
        name
      } = route;
      const isRootRoute = route === _rootRoute;
      const ParentName = parentName || _rootRoute.name;
      let parent = find(_routes, ({ name }) => name === ParentName);

      if (isRootRoute) {
        parent = _baseRoute;
      }

      if (!parent) {
        throw new Error(`No such parent route ("${ ParentName }") found for the route ("${ name }" in "${ routerName }" router)! (at Router#_init)`);
      }

      if (!parent.abstract && !isRootRoute) {
        throw new Error(`Parent route must be abstract (for "${ name }" route in "${ routerName }" router)! (at Router#_init)`);
      }

      if (!isRootRoute) {
        route.parentName = ParentName;
      }

      route.parent = parent;
    });

    iterate(_routes, (route) => {
      const {
        name,
        parent: {
          params: parentParams,
          paramsValidators: parentParamsValidators,
          queryValidators: parentQueryValidators,
          path
        },
        params,
        paramsValidators,
        queryValidators,
        relativeURL,
        relativePath
      } = route;
      const isRegExpPath = isRegExp(relativePath);
      const isDynamicPath = isRegExpPath || isFunction(relativePath);
      let proto = route;
      let count = 0;
      let newPath = isDynamicPath
        ? ''
        : relativePath;
      let newURL = isDynamicPath
        ? ''
        : relativeURL;

      if (isRegExp(path)) {
        throw new Error(`URL regexp route cannot be extended (for "${ name }" route in "${ routerName }" router)! (at Router#_init)`);
      }

      if (isFunction(path)) {
        throw new Error(`URL function route cannot be extended (for "${ name }" route in "${ routerName }" router)! (at Router#_init)`);
      }

      while (proto = proto.parent) {
        count += keysCount(proto.params);
        newPath = proto.relativePath + newPath;
        newURL = proto.relativeURL + newURL;

        proto.children.push(route);
      }

      const wholePath = newPath.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

      newPath = isDynamicPath
        ? new RegExp(`^${ wholePath }([\\s\\S]+)$`)
        : new RegExp(`^${ wholePath }$`);
      newURL = isDynamicPath
        ? newPath
        : newURL.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

      setProto(params, parentParams);
      setProto(paramsValidators, parentParamsValidators);
      setProto(queryValidators, parentQueryValidators);

      iterate(params, (value, key) => {
        params[key] += count;
      });

      if (
        (route === _defaultRoute || route === _redirectRoute)
        && (!isEmpty(params) || !isEmpty(query))
      ) {
        throw new Error(`Default and fallback routes must not have URL or query params (for "${ name }" route in "${ routerName }" router)! (at Router#_init)`);
      }

      route.url = newURL;

      const paramsCount = allKeysCount(params);

      if (isDynamicPath) {
        route.pathMatch = (path) => {
          const match = newPath.test(path);

          if (!match) {
            return;
          }

          const rest = match[paramsCount + 1];
          const isMatch = isRegExpPath
            ? relativePath.test(rest)
            : relativePath(rest);

          if (isMatch) {
            return match;
          }
        };
      } else {
        route.pathMatch = (path) => (
          path.match(newPath)
        );
      }
    });

    this._changeRoute();

    window.addEventListener('popstate', () => {
      if (location.href !== initialURL) {
        pushed = true;
      }

      if (pushed) {
        this._changeRoute();
      }
    }, false);

    window.addEventListener('click', (e) => {
      let closestLink = e.target;

      while (closestLink && closestLink.tagName !== 'A') {
        closestLink = closestLink.parentNode;
      }

      if (
        closestLink
        && closestLink.getAttribute('target') !== '_blank'
        && !closestLink.hasAttribute('no-routing')
        && !e.noRouting
      ) {
        const push = !closestLink.hasAttribute('replace');
        const href = closestLink.getAttribute('href') || '';

        e.preventDefault();

        if (location.pathname + location.search + location.hash !== href) {
          this._forward(href, push);
        }
      }
    }, false);
  }

  _subscribe(name, callback) {
    const { _subscribers } = this;

    _subscribers.push({
      name,
      callback
    });

    return () => {
      const index = _subscribers.indexOf(callback);

      if (index !== -1) {
        _subscribers.splice(index, 1);
      }
    };
  }

  buildURL(name, options = {}) {
    const { _routes } = this;
    const route = find(_routes, ({ name: n }) => n === name);

    if (!route) {
      throw new Error(`There are no routes with name "${ name }"! (at router.buildURL)`);
    }

    const {
      url,
      encodeParams,
      encodeQuery
    } = route;

    if (isRegExp(url)) {
      throw new Error('URL can be built only from the string URLs! (at router.buildURL)');
    }

    const {
      params = {},
      query = {},
      hash = ''
    } = options;

    return constructURL(url, params, query, hash, encodeParams, encodeQuery);
  }

  go(name, options) {
    this._forward(this.buildURL(name, options), true);
  }

  goToURL(url) {
    this._forward(url, true);
  }

  pushURL(url) {
    this._changeHistory(url, true);
  }

  redirect(name, options) {
    this._forward(this.buildURL(name, options));
  }

  redirectToURL(url) {
    this._forward(url);
  }

  replaceURL(url) {
    this._changeHistory(url);
  }
}

export default Router;
