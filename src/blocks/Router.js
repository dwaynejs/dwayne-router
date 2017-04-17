import {
  routers,
  DEFAULT_ROUTER_NAME
} from '../constants';

export function Router(Block) {
  return class Router extends Block {
    static template = html`
      <d-if if="{isCurrentRoute && Block}">
        <d-block Constructor="{Block}" route="{routeParams}" d-rest="{restArgs}"/>
      </d-if>
    `;

    constructor(opts) {
      super(opts);

      const {
        name = DEFAULT_ROUTER_NAME
      } = this.args;
      const router = routers[name];

      if (router) {
        router._init();
        console.log(router);

        const {
          name,
          Block
        } = router._rootRoute;

        this.globals.router = router;
        this.globals.route = null;
        this.Block = Block;
        this.isCurrentRoute = router._currentRoutes.indexOf(router._rootRoute) !== -1;
        this.routeParams = router._currentRouteParams;
        this.unsubscribe = router._subscribe(name, (isCurrentRoute) => {
          this.isCurrentRoute = isCurrentRoute;
          this.routeParams = router._currentRouteParams;
          this.globals.route = router._currentRouteParams;
        });
      } else {
        console.error(`No router with the "${ name }" name was provided! (at new Router)`);
      }
    }

    afterConstruct() {
      this.watch('args', () => {
        const {
          name,
          ...restArgs
        } = this.args;

        this.restArgs = restArgs;
      });
    }

    beforeRemove() {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    }
  };
}
