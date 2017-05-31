import { strictEqual } from 'assert';
import { Block, Children, initApp, removeApp, doc } from 'dwayne';
import { Router, Route } from '../src';

let router;
const container = doc.create('div');
const $routes = {
  root: {
    abstract: true,
    block: class extends Block {
      static html = html`<Children/>`;

      afterConstruct() {
        router = this.args.router;
      }
    },
    children: {
      home: {
        path: '/',
        block: html`<h1>Home page</h1>`
      },
      404: {
        path: '/404',
        fallback: true,
        block: html`<p>Page not found</p>`
      },
      parent: {
        abstract: true,
        path: '/parent',
        children: {
          regexp: {
            path: /^\/regexp\/([\s\S]+)\/([\s\S]+)\??/,
            block: html`<i>Regexp additional params: [{args.route.additionalParams.join(', ')}]</i>`
          },
          func: {
            path(path) {
              const match = path.match(/^\/func\/([\s\S]+)\/([\s\S]+)\??/);

              return match && match.slice(1);
            },
            block: html`<span>Func additional params: [{args.route.additionalParams.join(', ')}]</span>`
          }
        }
      },
      trailingSlash: {
        path: '/trailing-slash',
        handleTrailingSlash: true,
        block: html`<q>Trailing slash</q>`
      },
      params: {
        path: '/params/:param1/ix-:param2/:param3',
        params: {
          param1(value) {
            const parsed = parseInt(value);

            return parsed || parsed === 0;
          },
          param2: ['1', '2', '3']
        },
        query: {
          param4: 'qwerty',
          param5: /^(?:ab|cd)$/
        },
        block: class extends Block {
          static html = html`
            <b>Params: {JSON.stringify([
              args.route.params.param1,
              args.route.params.param2,
              args.route.params.param3,
              args.route.query.param4,
              args.route.query.param5,
              args.route.query.param6,
              args.route.query.param7
            ])}</b>
          `;

          JSON = JSON;
        }
      },
      noTransforming: {
        decodeQuery: false,
        encodeQuery: false,
        decodeParams: false,
        encodeParams: false,
        path: '/no-transforming/:param',
        block: html`<h3>Params: [{[args.route.params.param, args.route.query.param].join(', ')}]</h3>`
      },
      transforming: {
        path: '/transforming/:param',
        block: html`<h3>Params: [{[args.route.params.param, args.route.query.param].join(', ')}]</h3>`
      }
    }
  }
};

describe('it should test Route block', () => {
  const oldConsoleError = console.error;

  beforeEach(() => {
    initApp(htmlScopeless`<Router routes="{$routes}"/>`, container);
  });
  afterEach(() => {
    removeApp(container);
    history.pushState(null, '', '/');
    console.error = oldConsoleError;
  });

  it('should be able to render redirect route', () => {
    router.goToURL('/not-covered');

    strictEqual(container.html(), '<p>Page not found</p>');
  });
  it('should be able to render default route', () => {
    const container = doc.create('div');
    const $routes = {
      default: {
        default: true,
        block: html`<h2>Not found</h2>`
      }
    };

    initApp(htmlScopeless`<Router routes="{$routes}"/>`, container);

    strictEqual(container.html(), '<h2>Not found</h2>');
  });
  it('should be able to handle regexp routes', () => {
    router.goToURL('/parent/regexp/a/b');

    strictEqual(container.html(), '<i>Regexp additional params: [a, b]</i>');
  });
  it('should be able to handle func routes', () => {
    router.goToURL('/parent/func/c/d');

    strictEqual(container.html(), '<span>Func additional params: [c, d]</span>');
  });
  it('should be able to handle trailing slash', () => {
    router.goToURL('/trailing-slash/');

    strictEqual(container.html(), '<q>Trailing slash</q>');
  });
  it('should be able to validate URL params and query params', () => {
    router.goToURL('/params/1/ix-3/value?param4=qwerty&param5=ab&param6&param7[s][]=1&param7[s][]=2&[]');

    strictEqual(container.html(), '<b>Params: ["1","3","value","qwerty","ab","",{"s":["1","2"]}]</b>');

    router.goToURL('/params/abc/ix-3/value?param4=qwerty&param5=ab&param6&param7[s][]=1&param7[s][]=2&[]');

    strictEqual(container.html(), '<p>Page not found</p>');

    router.goToURL('/params/1/ix-3/value?param4=abc&param5=ab&param6&param7[s][]=1&param7[s][]=2&[]');

    strictEqual(container.html(), '<p>Page not found</p>');
  });
  it('should log an error with a non-existent route name', (done) => {
    const container = doc.create('div');
    const $routes = {
      home: {
        block: html`<Route name="non-existent"/>`
      }
    };

    console.error = (message) => {
      console.error = oldConsoleError;

      const args = [];

      setTimeout(() => {
        try {
          strictEqual(message, 'No route with the "non-existent" name was provided! (at new Route)');
        } catch (err) {
          args.push(err);
        } finally {
          removeApp(container);

          done.apply(null, args);
        }
      }, 0);
    };

    initApp(htmlScopeless`<Router routes="{$routes}"/>`, container);
  });
});
