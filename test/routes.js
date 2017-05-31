import { throws } from 'assert';
import { Block, initApp, doc } from 'dwayne';
import { Router } from '../src';

describe('it should test different routes configs', () => {
  it('should not register a route without a block', () => {
    throws(() => {
      const routes = {
        route: {}
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /You must specify a block for a non-abstract route to render into \("route"\)! \(at Router#_traverse\)/);
  });
  it('should not register a route without a name', () => {
    throws(() => {
      const routes = {
        '': {}
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /Route must have a non-empty string "name" property! \(at Router#_traverse\)/);
  });
  it('should not register two routes with equal names', () => {
    throws(() => {
      const routes = {
        route: {
          abstract: true,
          children: {
            route: {}
          }
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /Route must have unique "name" property \("route"\)! \(at Router#_traverse\)/);
  });
  it('should not register two default routes', () => {
    throws(() => {
      const routes = {
        route1: {
          block: Block,
          default: true
        },
        route2: {
          block: Block,
          default: true
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /There can't be two default routes \("route1" and "route2"\)! \(at Router#_traverse\)/);
  });
  it('should not register two fallback routes', () => {
    throws(() => {
      const routes = {
        route1: {
          block: Block,
          fallback: true
        },
        route2: {
          block: Block,
          fallback: true
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /There can't be two fallback routes \("route1" and "route2"\)! \(at Router#_traverse\)/);
  });
  it('should not register a route with a non-abstract parent', () => {
    throws(() => {
      const routes = {
        route1: {
          block: Block,
          children: {
            route2: {
              block: Block
            }
          }
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /Parent route must be abstract \(for "route2" route\)! \(at Router#_traverse\)/);
  });
  it('should not register a route with a parent that has a dynamic route', () => {
    throws(() => {
      const routes = {
        route1: {
          abstract: true,
          path: /^\/$/,
          children: {
            route2: {
              block: Block
            }
          }
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /URL regexp and function routes cannot be extended \(for "route2" route\)! \(at Router#_traverse\)/);
  });
  it('should not register a default or fallback abstract route', () => {
    throws(() => {
      const routes = {
        route: {
          abstract: true,
          default: true
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /Default and fallback routes can't be abstract! \(at Router#_traverse\)/);
  });
  it('should not register a default route with a path', () => {
    throws(() => {
      const routes = {
        route: {
          default: true,
          path: '/',
          block: Block
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /Default route can't have a path! \(at Router#_traverse\)/);
  });
  it('should not register a fallback route with a regexp path', () => {
    throws(() => {
      const routes = {
        route: {
          path: /^\/$/,
          block: Block,
          fallback: true
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /Fallback route can't have a regexp path! \(at Router#_traverse\)/);
  });
  it('should not register a fallback route with a function path', () => {
    throws(() => {
      const routes = {
        route: {
          path() {},
          block: Block,
          fallback: true
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /Fallback route can't have a function path! \(at Router#_traverse\)/);
  });
  it('should not register a default or fallback route with URL params', () => {
    throws(() => {
      const routes = {
        route: {
          path: '/:id',
          block: Block,
          fallback: true
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /Default and fallback routes and their parents can't have URL or query params! \(at Router#_traverse\)/);
  });
  it('should not register a default or fallback route with query params', () => {
    throws(() => {
      const routes = {
        route: {
          block: Block,
          query: {
            a: ['1', '2']
          },
          fallback: true
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /Default and fallback routes and their parents can't have URL or query params! \(at Router#_traverse\)/);
  });
  it('should not register a default or fallback route with a parent that has URL params', () => {
    throws(() => {
      const routes = {
        route1: {
          abstract: true,
          path: '/:id',
          children: {
            route2: {
              block: Block,
              fallback: true
            }
          }
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /Default and fallback routes and their parents can't have URL or query params! \(at Router#_traverse\)/);
  });
  it('should not register a default or fallback route with a parent that has query params', () => {
    throws(() => {
      const routes = {
        route1: {
          abstract: true,
          query: {
            a: ['1', '2']
          },
          children: {
            route2: {
              block: Block,
              fallback: true
            }
          }
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /Default and fallback routes and their parents can't have URL or query params! \(at Router#_traverse\)/);
  });
  it('should not register a route with invalid path', () => {
    throws(() => {
      const routes = {
        route: {
          block: Block,
          path: []
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /Route path must be a string, regexp, function, null or undefined! \(at new Route\)/);

    throws(() => {
      const routes = {
        route: {
          block: Block,
          path: 'a/'
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /If route path is a string it must start with "\/"! \(at new Route\)/);

    throws(() => {
      const routes = {
        route: {
          block: Block,
          path: '//'
        }
      };

      initApp(htmlScopeless`<Router routes="{routes}"/>`, doc.create('div'));
    }, /If route path is a string it must not contain "\/\/" or end with "\/"! \(at new Route\)/);
  });
});
