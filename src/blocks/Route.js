import RouteBlock from './RouteBlock';

export class Route extends RouteBlock {
  constructor(opts) {
    super(opts);

    const { name } = this.args;
    const { router } = this.globals;
    const route = router._findRouteByName(name);
    const onChangeRoute = () => {
      this.routeParams = router._currentRouteParams;
      this.isCurrentRoute = router._currentRoutes.indexOf(route) !== -1;
    };

    if (route) {
      this.Block = route.block;
      this.router = router;
      this.route = route;
      this.unsubscribe = router._subscribe(name, onChangeRoute);

      onChangeRoute();
    } else {
      console.error(`No route with the "${ name }" name was provided! (at new Route)`);
    }
  }
}
