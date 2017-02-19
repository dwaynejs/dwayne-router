import {
  routers,
  DEFAULT_ROUTER_NAME
} from '../constants';

export function Router(Block) {
  return class Router extends Block {
    static template = ''
      + '<d-if if="{blockName}">'
        + '<d-block name="{blockName}" route="{route}" d-rest="{restArgs}"/>'
      + ' </d-if>';

    constructor(opts) {
      super(opts);

      const {
        name = DEFAULT_ROUTER_NAME,
        ...restArgs
      } = this.args;
      const router = routers[name];

      if (router) {
        router._init();

        this.global.router = router;
        this.global.route = null;
        this.blockName = router._rootRoute.block;
        this.restArgs = restArgs;
      } else {
        console.error(`No router with the "${ name }" name was provided! (at new Router)`);
      }
    }
  };
}
