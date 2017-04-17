export function Route(Block) {
  return class Route extends Block {
    static template = html`
      <d-if if="{isCurrentRoute && Block}">
        <d-block Constructor="{Block}" route="{routeParams}" d-rest="{restArgs}"/>
      </d-if>
    `;

    constructor(opts) {
      super(opts);

      const { name } = this.args;
      const { router } = this.globals;
      const route = router._findRouteByName(name);

      if (route) {
        this.Block = route.Block;
        this.isCurrentRoute = router._currentRoutes.indexOf(route) !== -1;
        this.routeParams = router._currentRouteParams;
        this.unsubscribe = router._subscribe(name, (isCurrentRoute) => {
          this.isCurrentRoute = isCurrentRoute;
          this.routeParams = router._currentRouteParams;
        });
      } else {
        console.error(`No route with the "${ name }" name in "${ router.name }" router was provided! (at new Route)`);
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
