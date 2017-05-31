import { Block, Children } from 'dwayne';
import RouterInternal from '../RouterInternal';
import { Route } from './Route';

export class Router extends Block {
  static html = html`
    <Route name="$root">
      <Children/>
    </Route>
  `;

  constructor(opts) {
    super(opts);

    const {
      routes,
      ...options
    } = this.args;
    const router = new RouterInternal(routes, options);
    const onChangeRoute = () => {
      this.globals.route = router._currentRouteParams;
    };

    this.router = router;
    this.globals.router = router;
    this.unsubscribe = router._subscribe('', onChangeRoute);

    onChangeRoute();
  }

  beforeRemove() {
    super.beforeRemove();

    this.router._remove();
  }
}
