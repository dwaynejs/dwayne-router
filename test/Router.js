import { strictEqual, throws } from 'assert';
import { test, deferTest } from 'dwayne-test-utils';
import { Block, initApp, removeApp, body } from 'dwayne';
import { Router, Route } from '../src';

const container = body.create('div');
let router;

class Root extends Block {
  static html = html`
    <Route name="home"/>
    <Route name="another"/>
    <Route name="info"/>
    <Route name="param"/>
    <Route name="links"/>
  `;

  afterConstruct() {
    router = this.args.router;
  }
}

const Home = html`
  <h1>Home page</h1>
`;

const Another = html`
  <span>Another route</span>
`;

const Info = html`
  <i>Info</i>
`;

const Links = html`
  <a href="{args.router.buildURL('info')}" id="info"/>
  <a href="javascript:__javascriptClickTestFunction__()" id="js"/>
  <a href="{args.router.buildURL('info')}" id="disabled" disabled/>
`;

const $routes = {
  abstract: true,
  block: Root,
  children: {
    home: {
      path: '/',
      block: Home
    },
    another: {
      path: '/another',
      block: Another
    },
    info: {
      path: '/info',
      block: Info
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
      block: Links
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
      test(done, () => {
        strictEqual(container.html(), '<h1>Home page</h1>');
      });
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
  it('should be able to handle router link clicks', (done) => {
    router.go('links');

    strictEqual(container.find('#info').length, 1);

    deferTest(done, () => {
      strictEqual(container.html(), '<i>Info</i>');
    }, 50);

    container
      .find('#info')[0]
      .click();
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
