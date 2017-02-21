import {
  isEmpty,
  isFunction,
  isRegExp,
  assign
} from './utils';
import {
  routers,
  DEFAULT_ROUTER_NAME
} from './constants';
import Router from './Router';
import Route from './Route';

export function route(options) {
  return (Block) => {
    options = assign({}, options, Block.routerOptions);

    const {
      name,
      router = DEFAULT_ROUTER_NAME,
      path,
      abstract,
      root,
      fallback,
      replace = true,
      default: isDefault,
      params,
      query
    } = options || {};
    const routerInstance = (routers[router] = routers[router] || new Router(router));
    const {
      _initialized,
      _routes,
      _rootRoute,
      _defaultRoute,
      _redirectRoute
    } = routerInstance;

    if (_initialized) {
      console.warn('Router was already initialized (at route)');

      return Block;
    }

    if (_rootRoute && root) {
      throw new Error(`There can't be two root routes ("${ _rootRoute.name }" and "${ name }")! (at route)`);
    }

    if (_defaultRoute && isDefault) {
      throw new Error(`There can't be two default routes ("${ _defaultRoute.name }" and "${ name }")! (at route)`);
    }

    if (_redirectRoute && fallback) {
      throw new Error(`There can't be two fallback routes ("${ _defaultRoute.name }" and "${ name }")! (at route)`);
    }

    if (!name) {
      throw new Error('State must have a non-empty string "name" property! (at route)');
    }

    if (routerInstance._findRouteByName(name)) {
      throw new Error('State must have unique "name" property! (at route)');
    }

    const route = new Route(options);

    if (root) {
      routerInstance._rootRoute = route;
    }

    if (fallback) {
      route.redirectRouteIsNeededToPush = !replace;
      routerInstance._redirectRoute = route;
    }

    if (isDefault) {
      routerInstance._defaultRoute = route;
    }

    if (fallback || isDefault) {
      if (abstract) {
        throw new Error('Default and fallback routes can\'t be abstract! (at route)');
      }

      if (isRegExp(path)) {
        throw new Error('Default and fallback routes can\'t have a regexp path! (at route)');
      }

      if (isFunction(path)) {
        throw new Error('Default and fallback routes can\'t have a function path! (at route)');
      }

      if (!isEmpty(params) || !isEmpty(query)) {
        throw new Error('Default and fallback routes can\'t have URL or query params! (at route)');
      }
    }

    _routes.push(route);

    return Block;
  };
}
