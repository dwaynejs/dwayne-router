import { Elem } from 'dwayne';
import {
  isEmpty,
  isFunction,
  isRegExp,
  isString,
  isNil,
  assign,
  find,
  iterate,
  decode
} from './utils';
import Route from './Route';
import {
  location,
  initialURL
} from './constants';
import constructURL from './constructURL';
import resolveURL from './resolveURL';

let pushed;

/**
 * @typedef {Object} URLOptions
 * @property {Object} [query = {}] - URL query params.
 * @property {Object} [params = {}] - URL params.
 * @property {String} [hash = ''] - URL hash.
 */

/**
 * @class DwayneRouter
 * @public
 */
class Router {
  _routes = [];
  _currentRoutes = [];
  _subscribers = [];
  _rootRoute = null;
  _defaultRoute = null;
  _redirectRoute = null;

  constructor(routes, options) {
    const {
      handleTrailingSlash,
      useOwnChildren
    } = options;

    this._handleTrailingSlash = !!handleTrailingSlash;
    this._useOwnChildren = !!useOwnChildren;

    this._traverse({
      $root: routes
    });
    this._changeRoute();

    window.addEventListener('popstate', this._onPopstate, false);
    window.addEventListener('click', this._onClick, false);
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
      /* istanbul ignore next */
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
          redirectRouteIsNeededToPush
        } = this._redirectRoute;

        return this._forward(constructURL(url, {}, {}, ''), redirectRouteIsNeededToPush);
      }

      currentRoute = null;
      currentRouteParams = null;
    }

    const {
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

      while (currentParent !== parent && currentParent) {
        routesToLoad.unshift(currentParent);
        currentParent = currentParent.parent;
      }

      _currentRoutes.push(...routesToLoad);
    }

    this._currentRouteParams = currentRouteParams;

    iterate(routesToLeave.concat(_currentRoutes), ({ name }) => {
      iterate(_subscribers, ({ name: Name, callback }) => {
        if (name === Name) {
          callback();
        }
      });
    });
  }

  _findRouteByName(name) {
    return find(this._routes, ({ name: Name }) => name && name === Name);
  }

  _findRouteByURL() {
    const {
      _routes,
      _defaultRoute
    } = this;
    const {
      pathname,
      search
    } = location;
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
        queryValidators
      } = route;
      const resolved = resolveURL();
      const {
        query,
        hash
      } = resolved;
      const eventualParams = {};
      const match = pathMatch(pathname + (isRegExp(routeURL) ? search : ''));

      if (!match) {
        return;
      }

      const invalidQuery = iterate(queryValidators, (validator, param) => {
        if (!validator(query[param])) {
          return true;
        }
      });

      if (invalidQuery) {
        return;
      }

      const invalidParams = iterate(params, (index, param) => {
        const value = match[index];
        const validator = paramsValidators[param];
        const eventualValue = decode(value);

        if (validator && !validator(eventualValue)) {
          return true;
        }

        eventualParams[param] = eventualValue;
      });

      if (invalidParams) {
        return;
      }

      urlParams = {
        route,
        params: eventualParams,
        additionalParams: match,
        query: { ...query },
        hash
      };

      return true;
    });

    if (urlParams) {
      return urlParams;
    }

    if (!_defaultRoute) {
      return;
    }

    const {
      query,
      hash
    } = resolveURL();

    return {
      route: _defaultRoute,
      params: {},
      additionalParams: [],
      query: { ...query },
      hash
    };
  }

  _forward(url, push) {
    this._changeHistory(url, push);
    this._changeRoute();
  }

  _traverse(routes, parent) {
    iterate(routes, (opts, name) => {
      const {
        _defaultRoute,
        _redirectRoute
      } = this;
      const {
        path,
        block,
        abstract,
        fallback,
        replace = true,
        default: isDefault,
        params,
        query,
        children
      } = opts;

      if (!name) {
        throw new Error('Route must have a non-empty string "name" property! (at Router#_traverse)');
      }

      if (this._findRouteByName(name)) {
        throw new Error(`Route must have unique "name" property ("${ name }")! (at Router#_traverse)`);
      }

      if (_defaultRoute && isDefault) {
        throw new Error(`There can't be two default routes ("${ _defaultRoute.name }" and "${ name }")! (at Router#_traverse)`);
      }

      if (_redirectRoute && fallback) {
        throw new Error(`There can't be two fallback routes ("${ _redirectRoute.name }" and "${ name }")! (at Router#_traverse)`);
      }

      if (!abstract && !block) {
        throw new Error(`You must specify a block for a non-abstract route to render into ("${ name }")! (at Router#_traverse)`);
      }

      if (parent && !parent.abstract) {
        throw new Error(`Parent route must be abstract (for "${ name }" route)! (at Router#_traverse)`);
      }

      if (parent && !isString(parent.url)) {
        throw new Error(`URL regexp and function routes cannot be extended (for "${ name }" route)! (at Router#_traverse)`);
      }

      if (fallback || isDefault) {
        if (abstract) {
          throw new Error('Default and fallback routes can\'t be abstract! (at Router#_traverse)');
        }

        if (isRegExp(path)) {
          throw new Error('Default and fallback routes can\'t have a regexp path! (at Router#_traverse)');
        }

        if (isFunction(path)) {
          throw new Error('Default and fallback routes can\'t have a function path! (at Router#_traverse)');
        }
      }

      const route = new Route(assign({}, opts, {
        name,
        parent,
        router: this
      }));

      if (fallback || isDefault) {
        if (
          !isEmpty(route.params)
          || (parent && !isEmpty(parent.params))
          || !isEmpty(query)
          || (parent && !isEmpty(parent.query))
        ) {
          throw new Error('Default and fallback routes and their parents can\'t have URL or query params! (at Router#_traverse)');
        }
      }

      if (name === '$root') {
        this._rootRoute = route;
      }

      if (fallback) {
        route.redirectRouteIsNeededToPush = !replace;
        this._redirectRoute = route;
      }

      if (isDefault) {
        this._defaultRoute = route;
      }

      this._routes.push(route);
      this._traverse(children, route);
    });
  }

  _subscribe(name, callback) {
    const { _subscribers } = this;
    const subscribeObject = {
      name,
      callback
    };

    _subscribers.push(subscribeObject);

    return () => {
      const index = _subscribers.indexOf(subscribeObject);

      /* istanbul ignore else */
      if (index !== -1) {
        _subscribers.splice(index, 1);
      }
    };
  }

  _remove() {
    window.removeEventListener('popstate', this._onPopstate, false);
    window.removeEventListener('click', this._onClick, false);
  }

  _onPopstate = () => {
    /* istanbul ignore else */
    if (location.href !== initialURL) {
      pushed = true;
    }

    /* istanbul ignore else */
    if (pushed) {
      this._changeRoute();
    }
  };

  _onClick = (e) => {
    const $link = new Elem(e.target).closest('a');
    const href = $link.attr('href');

    if (
      !$link.length
      || $link.attr('target') === '_blank'
      || $link.hasAttr('no-routing')
      || isNil(href)
      || (
        href.indexOf('/') !== 0
        && href.indexOf(location.origin) !== 0
      )
    ) {
      return;
    }

    const push = !$link.hasAttr('replace');

    e.preventDefault();

    if (
      location.pathname + location.search + location.hash !== href
      && !$link.hasAttr('disabled')
    ) {
      this._forward(href, push);
    }
  };

  /**
   * @method DwayneRouter#buildURL
   * @public
   * @param {String} name - Route name.
   * @param {URLOptions} [options = {}] - URL options.
   * @returns {String} Constructed URL.
   * @description Method for constructing an URL for the route that is specified by the first argument
   * with the options provided in the second one.
   *
   * @example
   * // URL: '/route/:param'
   *
   * router.buildURL('route', {
   *   params: {
   *     param: 'value'
   *   },
   *   query: {
   *     param: 'value'
   *   },
   *   hash: 'hash'
   * }); // '/route/value?param=value#hash'
   */
  buildURL(name, options = {}) {
    const { _routes } = this;
    const route = find(_routes, ({ name: n }) => n === name);

    if (!route) {
      throw new Error(`There are no routes with name "${ name }"! (at Router#buildURL)`);
    }

    if (route.abstract) {
      throw new Error(`URL can only be built for non-abstract routes (name: "${ name }")! (at Router#buildURL)`);
    }

    const { url } = route;

    if (!isString(url)) {
      throw new Error(`URL can only be built from string URLs (name: "${ name }")! (at Router#buildURL)`);
    }

    const {
      params = {},
      query = {},
      hash = ''
    } = options;

    return constructURL(url, params, query, hash);
  }

  /**
   * @method DwayneRouter#go
   * @public
   * @param {String} name - Route name.
   * @param {URLOptions} [options = {}] - URL options.
   * @returns {void}
   * @description Method for navigating to the route that is specified by the first argument
   * with the options provided in the second one.
   *
   * @example
   * router.go('route', {
   *   params: {
   *     param: 'value'
   *   },
   *   query: {
   *     param: 'value'
   *   },
   *   hash: 'hash'
   * });
   */
  go(name, options) {
    this._forward(this.buildURL(name, options), true);
  }

  /**
   * @method DwayneRouter#goToURL
   * @public
   * @param {String} url - URL to navigate to.
   * @returns {void}
   * @description Method for navigating to an URL.
   *
   * @example
   * router.goToURL('/route');
   */
  goToURL(url) {
    this._forward(url, true);
  }

  /**
   * @method DwayneRouter#pushURL
   * @public
   * @param {String} url - URL to push.
   * @returns {void}
   * @description Method for pushing an URL without re-rendering the layout.
   *
   * @example
   * router.pushURL('/route');
   */
  pushURL(url) {
    this._changeHistory(url, true);
  }

  /**
   * @method DwayneRouter#redirect
   * @public
   * @param {String} name - Route name.
   * @param {URLOptions} [options = {}] - URL options.
   * @returns {void}
   * @description Method for redirecting to the route that is specified by the first argument
   * with the options provided in the second one (the method replaces current URL with the new one).
   *
   * @example
   * router.redirect('route', {
   *   params: {
   *     param: 'value'
   *   },
   *   query: {
   *     param: 'value'
   *   },
   *   hash: 'hash'
   * });
   */
  redirect(name, options) {
    this._forward(this.buildURL(name, options));
  }

  /**
   * @method DwayneRouter#redirectToURL
   * @public
   * @param {String} url - URL to redirect to.
   * @returns {void}
   * @description Method for redirecting to an URL (the method replaces current URL with the new one).
   *
   * @example
   * router.redirectToURL('/route');
   */
  redirectToURL(url) {
    this._forward(url);
  }

  /**
   * @method DwayneRouter#pushURL
   * @public
   * @param {String} url - URL to replace with.
   * @returns {void}
   * @description Method for replacing the URL without re-rendering the layout.
   *
   * @example
   * router.pushURL('/route');
   */
  replaceURL(url) {
    this._changeHistory(url);
  }
}

export default Router;
