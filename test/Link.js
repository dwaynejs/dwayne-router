import { strictEqual } from 'assert';
import { Block, initApp, removeApp, doc } from 'dwayne';
import { Router, Link } from '../src';

let root;
const container = doc.create('div');
const $routes = {
  abstract: true,
  block: class extends Block {
    static html = html`
      <Link
        to="route"
        params="{params}"
        query="{query}"
        hash="{hash}"
      >
        Link 1
      </Link>

      <Link href="{href}">
        Link 2
      </Link>
    `;

    params = {
      param: 'value'
    };
    query = {
      param: 'value'
    };
    hash = 'hash';
    href = '/route/val';

    afterConstruct() {
      root = this;
    }
  },
  children: {
    home: {
      block: []
    },
    route: {
      path: '/route/:param',
      block: []
    }
  }
};

describe('it should test Link block', () => {
  before(() => {
    initApp(htmlScopeless`<Router routes="{$routes}"/>`, container);
  });
  after(() => {
    removeApp(container);
  });

  it('should be rendered right', () => {
    strictEqual(container.html(), '<a href="/route/value?param=value#hash">Link 1</a><a href="/route/val">Link 2</a>');

    root.params = {
      param: 'value2'
    };
    root.query = {
      param: 'value3'
    };
    root.hash = 'hash4';
    root.href = '/route/value5';

    strictEqual(container.html(), '<a href="/route/value2?param=value3#hash4">Link 1</a><a href="/route/value5">Link 2</a>');
  });
});
