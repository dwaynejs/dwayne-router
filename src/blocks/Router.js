import RouterInternal from '../Router';
import RouteBlock from './RouteBlock';

export class Router extends RouteBlock {
  constructor(opts) {
    super(opts);

    const {
      routes,
      ...options
    } = this.args;
    const router = new RouterInternal(routes, options);
    const route = router._rootRoute;
    const onChangeRoute = () => {
      this.routeParams = router._currentRouteParams;
      this.globals.route = router._currentRouteParams;
      this.isCurrentRoute = router._currentRoutes.indexOf(route) !== -1;
    };

    // console.log(router);

    const {
      name,
      block
    } = route;

    this.globals.router = router;
    this.Block = block;
    this.router = router;
    this.route = route;
    this.unsubscribe = router._subscribe(name, onChangeRoute);

    onChangeRoute();
  }

  beforeRemove() {
    super.beforeRemove();

    this.router._remove();
  }
}
