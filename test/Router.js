import { strictEqual, deepStrictEqual, throws } from 'assert';
import { test, deferTest } from 'dwayne-test-utils';
import { Block, Children, initApp, removeApp, body } from 'dwayne';
import { Router, Route } from '../src';

const container = body.create('div');
const additional = {};
let router;
let homeArgs;

const $routes = {
  root: {
    abstract: true,
    block: class extends Block {
      static html = html`
        <Route name="home" a="{1}" b="{additional}"/>
        <Route name="another"/>
        <Route name="info"/>
        <Route name="param"/>
        <Route name="func"/>
        <Route name="links"/>
      `;

      additional = additional;

      afterConstruct() {
        router = this.args.router;
      }
    },
    children: {
      home: {
        path: '/',
        block: class extends Block {
          static html = html`<h1>Home page</h1>`;

          afterConstruct() {
            router = this.args.router;
            homeArgs = { ...this.args };

            delete homeArgs.router;
            delete homeArgs.route;
          }
        }
      },
      another: {
        path: '/another',
        block: html`<span>Another route</span>`
      },
      info: {
        path: '/info',
        block: html`<i>Info</i>`
      },
      param: {
        path: '/param/:param',
        block: []
      },
      func: {
        path() {},
        block: []
      },
      links: {
        path: '/links',
        block: html`
          <a href="{args.router.buildURL('info')}" id="info"/>
          <a href="javascript:__javascriptClickTestFunction__()" id="js"/>
          <a href="{args.router.buildURL('info')}" id="disabled" disabled/>
        `
      }
    }
  }
};

before(() => {
  history.pushState(null, '', '/');
});

describe('it should test Router block', () => {
  let callback = () => {};
  const listener = () => {
    callback();
  };

  beforeEach(() => {
    initApp(htmlScopeless`<Router routes="{$routes}"/>`, container);
    window.addEventListener('popstate', listener, false);
  });
  afterEach(() => {
    window.removeEventListener('popstate', listener, false);
    removeApp(container);
    history.pushState(null, '', '/');
    delete window.__javascriptClickTestFunction__;
  });

  it('should render it', () => {
    strictEqual(container.html(), '<h1>Home page</h1>');
  });
  it('should pass rest args to the block', () => {
    deepStrictEqual({ ...homeArgs }, {
      a: 1,
      b: additional
    });
  });
  it('should be able to navigate', () => {
    router.go('another');

    strictEqual(container.html(), '<span>Another route</span>');
  });
  it('should be able to go to another URL', () => {
    router.goToURL('/another');

    strictEqual(container.html(), '<span>Another route</span>');
  });
  it('should be able to redirect', (done) => {
    router.go('another');

    strictEqual(container.html(), '<span>Another route</span>');

    router.redirect('info');

    strictEqual(container.html(), '<i>Info</i>');

    callback = () => {
      deferTest(done, () => {
        strictEqual(container.html(), '<h1>Home page</h1>');
      }, 30);
    };

    history.back();
  });
  it('should be able to redirect to an URL', (done) => {
    router.go('another');

    strictEqual(container.html(), '<span>Another route</span>');

    router.redirectToURL('/info');

    strictEqual(container.html(), '<i>Info</i>');

    callback = () => {
      test(done, () => {
        strictEqual(container.html(), '<h1>Home page</h1>');
      });
    };

    history.back();
  });
  it('should be able to go to an URL that is not covered by any paths', () => {
    router.goToURL('/non-covered');

    strictEqual(container.html(), '');
  });
  it('should be able to build an URL', () => {
    strictEqual(router.buildURL('home'), '/');
    strictEqual(router.buildURL('another'), '/another');
    strictEqual(router.buildURL('info'), '/info');
    strictEqual(router.buildURL('param', {
      params: {
        param: '123'
      },
      query: {
        param: 'value',
        obj: {
          arr: [{ key: 'val' }, 'elem2'],
          str: 'string'
        }
      },
      hash: 'hash'
    }), '/param/123?param=value&obj[arr][][key]=val&obj[arr][]=elem2&obj[str]=string#hash');

    throws(() => {
      router.buildURL('doesn\'t exist');
    }, /There are no routes with name "doesn't exist"! \(at Router#buildURL\)/);
    throws(() => {
      router.buildURL('$root');
    }, /URL can only be built for non-abstract routes \(name: "\$root"\)! \(at Router#buildURL\)/);
    throws(() => {
      router.buildURL('func');
    }, /URL can only be built from string URLs \(name: "func"\)! \(at Router#buildURL\)/);
  });
  it('should be able to handle non-router link clicks and do nothing', (done) => {
    router.go('links');

    strictEqual(container.find('#js').length, 1);

    window.__javascriptClickTestFunction__ = done;

    container
      .find('#js')[0]
      .click();
  });
  it('should be able to handle router link clicks', () => {
    router.go('links');

    strictEqual(container.find('#info').length, 1);

    container
      .find('#info')
      .dispatch('click');

    strictEqual(container.html(), '<i>Info</i>');
  });
  it('should be able to not handle disabled link clicks but still stop their default behaviour', (done) => {
    router.go('links');

    strictEqual(container.find('#disabled').length, 1);

    deferTest(done, () => {
      strictEqual(container.html(), ''
        + '<a href="/info" id="info"></a>'
        + '<a href="javascript:__javascriptClickTestFunction__()" id="js"></a>'
        + '<a href="/info" id="disabled" disabled=""></a>');
    }, 50);

    container
      .find('#disabled')[0]
      .click();
  });
  it('should be able to push an URL without re-rendering', () => {
    router.pushURL('/info');

    strictEqual(container.html(), '<h1>Home page</h1>');
  });
  it('should be able to replace an URL without re-rendering', () => {
    router.replaceURL('/info');

    strictEqual(container.html(), '<h1>Home page</h1>');
  });
});
