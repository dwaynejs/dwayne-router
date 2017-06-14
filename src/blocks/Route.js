import { Block, If, Children, DynamicBlock, Each, Rest } from 'dwayne';
import { omit } from '../utils';

const watchArgs = ($) => (
  omit($.args, ['name'])
);

export class Route extends Block {
  static html = html`
    <If if="{isCurrentRoute && Block}">
      <DynamicBlock
        type="{Block}"
        route="{routeParams}"
        router="{router}"
        Rest="{restArgs}"
      >
        <If if="{router._useOriginalChildren}">
          <Children/>
        </If>
        <If if="{!router._useOriginalChildren}">
          <Each
            set="{route.ownChildren}"
            item="route"
            uid="{(route) => route.name}"
          >
            <Route name="{route.name}"/>
          </Each>
        </If>
      </DynamicBlock>
    </If>
  `;

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

  afterConstruct() {
    this.setRestArgs(
      this.evaluate(watchArgs, this.setRestArgs)
    );
  }

  beforeRemove() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  setRestArgs = (rest) => {
    this.restArgs = rest;
  };
}
