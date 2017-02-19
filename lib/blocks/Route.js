import { find } from '../utils';

export function Route(Block) {
  return class Route extends Block {
    /* eslint prefer-template: 0 */
    static template = ''
      + '<d-if if="{blockName}">'
        + '<d-if if="{isCurrentRoute}">'
          + '<d-block name="{blockName}" route="{routeParams}" d-rest="{restArgs}"/>'
        + ' </d-if>'
      + '</d-if>';

    constructor(opts) {
      super(opts);

      const {
        name,
        ...restArgs
      } = this.args;
      const { router } = this.global;
      const route = find(router._findRouteByName(name));

      if (route) {
        this.blockName = route.block;
        this.restArgs = restArgs;
        this.isCurrentRoute = router._currentRoutes.indexOf(route) !== -1;
        this.routeParams = router._currentRouteParams;
        this.unsubscribe = router._subscribe(name, (isCurrentRoute) => {
          this.isCurrentRoute = isCurrentRoute;
        });
      } else {
        console.error(`No route with the "${ name }" name in "${ router.name }" router was provided! (at new Route)`);
      }
    }

    beforeRemove() {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    }
  };
}
