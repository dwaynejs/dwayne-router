# dwayne-router

### Why?

The plugin is needed for routing your app in a very convenient way.
It uses [HTML5 History API](https://developer.mozilla.org/en/docs/Web/API/History)
for manipulating browser history without reloading the page.

### Installation

```bash
$ npm install --save dwayne-router
```

### Exports

The plugin exports [Router](#router), [Route](#route) and
[Link](#link) blocks.

### `route` object

Route object describes a route with many options:

##### abstract

Default: `false`

If the route is `abstract` it can't be rendered as a high-level
route (the current route), but it's rendered when one of the
children is the current route.

An `abstract` route can't be the `default` route or the `fallback`
route.

A non-abstract route can't have children (meaning it's a
high-level route).

##### path

Default: `'/'`

Describes a route `path`. Must start with a `'/'`. May be a
string, regexp or a function.

All types accept the part of the path, which is relative to the
parent path.

* string: may contain URL params which look like `:paramName`.
An URL part (between slashes) may contain only one URL param.
* regexp: may contain captured groups which will be
remembered and passed as the `additionalParams` route option.
* function: if returns truthy value, it's passed as `additionalParams`
route option.

##### block

Describes the block which is rendered when the path matches the
page URL.

If a route is `abstract`, the option may be not specified
and it defaults to the block which renders its children
(see [useOriginalChildren](#useoriginalchildren)).

If it's not abstract, the option is required and must be a `Block`
class or a template.

##### query

Default: `{}`

An object which describes query params validators. The keys are
params keys and the values are validators. A validator may be one
of the following:

* array: the param matches if it's one of the array values.
* regexp: the param matches if it's present and if it matches the
regexp.
* function: the param matches if the function returns a truthy value.
* the rest: the param matches if it equals to the validator.

##### params

Default: `{}`

Similar to the `query` option, but for URL params.

##### default

Default: `false`

If `true`, this route is considered the default route. Each time
the page URL doesn't match any routes, the default route is
rendered (without changing the page URL).

Restrictions:

* Default route can't have an URL.
* There can't be two default routes.
* Default route and its parents can't have a dynamic path
(regexp or function).
* Default route and its parents can't have URL and query params.

##### fallback

Default: `false`

Similar to the [default](#default) option, only it makes the router
change the page URL to the URL of the fallback route.

The same restrictions (as for `default` route) stand for `fallback`
route (except for the first one).

##### replace

Default: `true`

Fallback route may have an additional `replace` option. If `true`,
the router replaces (see [History#replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_replaceState()_method))
the page URL with the fallback URL, when the URL doesn't match any
routes, and if `false` it pushes the URL (see [History#pushState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method)).

##### children

Default: `{}`

Route children routes object. The keys are routes names (which
must be unique) and the values are their descriptions. The root
route has `$root` name.

A high-level (non-abstract) route can't have children.

##### handleTrailingSlash

Default: `router.args.handleTrailingSlash`
(see [handleTrailingSlash](#handletrailingslash))

If `true`, the router handles trailing slash URLs the same way
as without them, and if `false`, it doesn't.

If not specified, defaults to the same `Router` arg.

### Router

The block renders the root `Route` block. It sets the global `router`
and `route` variables (see [Route](#route)).
 
It accepts three args (all of them are not watched):

##### routes

Required. Describes the root route children.
(see [route children](#children)). Basically it's the whole structure
of all the routes that are handled by the router.

Example:

```js
// routes.js

// import this module and pass as an arg to the Router block

import Home from 'HomeBlockPath';
import NotFound from 'NotFoundBlockPath';

import Login from 'LoginBlockPath';
import Register from 'RegisterBlockPath';

import Users from 'UsersBlockPath';
import UsersList from 'UsersListBlockPath';
import User from 'UserBlockPath';

const routes = {
  abstract: true,
  children: {
    home: {
      path: '/', // matches '/'
      block: Home
    },
    404: {
      path: '/404',
      // will be rendered when no route will match the URL
      fallback: true,
      block: NotFound
    },
    auth: {
      abstract: true,
      path: '/auth',
      // no block field because Route block can
      // automatically render its child routes
      children: {
        login: {
          path: '/login', // matches '/auth/login'
          block: Login
        },
        register: {
          path: '/register', // matches '/auth/register'
          block: Register
        }
      }
    },
    users: {
      abstract: true,
      path: '/users',
      block: Users,
      children: {
        usersList: {
          // path defaults to '/' so the full path is '/users',
          block: UsersList
        },
        user: {
          path: '/:id', // for example, matches '/users/12'
          block: User,
          params: {
            id: /^\d+$/ // id param matches only digits
          }
        }
      }
    }
  }
};

export default routes;
```

##### handleTrailingSlash

Default: `false`

If true, the router will handle URLs with a trailing slash (such
as `/login/`).

##### useOriginalChildren

Default: `false`

If true, the router will pass the children of the `Router` and
`Route` blocks to the corresponding block, which is specified in the
route object. Otherwise, these blocks will pass its own child routes
as children.

Examples of the possible layout for the structure above:

`true` value (more declarative way):

```html
<!-- App/index.html -->
<Header/>
<section>
  <Router routes="{routes}" useOriginalChildren>
    <Route name="home"/>
    <Route name="404"/>
    <Route name="auth">
      <Route name="login"/>
      <Route name="register"/>
    </Route>
    <Route name="users">
      <div class="users-content">
        <Route name="usersList"/>
        <Route name="user"/>
      </div>
    </Route>
  </Router>
</section>
<Footer/>
```

> Note: in this example you may not need the Users block, because
the `div.users-content` container is already included in the layout.
Though you may move this part of the layout to the Users block.

`false` value (more minimalistic way):

```html
<!-- App/index.html -->
<Header/>
<section>
  <Router routes="{routes}"/>
</section>
<Footer/>

<!-- Users/index.html -->
<div class="users-content">
  <!-- Children are its own child routes: usersList and user -->
  <Children/>
</div>
```

### Route

The block renders the block, which is specified in the route (pass
the route name as an arg to this block) description. It passes it
the children (see [useOriginalChildren](#useoriginalchildren)).

It passes it two arguments as well:

* `router` is an instance of the [RouterInternal](#routerinternal) class.
* `route` is an instance of the [RouteParams](#routeparams).

It also passes all the args it received as rest args.

### Link

The block renders an anchor (HTML `a` tag) with a href that is
specified by the args. There are two types of args:

* usual `href` anchor attribute. the block just passes it to the
anchor.
* `to` (name of the route), `params`, `query` and `hash` args. They
are passed to [RouterInternal#buildURL](#buildurl).

The block also passes the children and the rest args to the anchor.

Example:

```html
<Link href="/route">Link text</Link>

<Link
  to="route"
  params="{{ a: '1' }}"
  query="{{ b: '2' }}"
  hash="hash"
>
  Link text
</Link>
```

### RouterInternal

This is a class which has the following methods:

##### buildURL

API: `router.buildURL(name: String, options?: URLOptions): String`

The method builds an URL (relative to the page origin URL) and
returns it.

* `name`: name of the route which you want to build the URL for.
* `options`: an object with the following properties:
  * params (default: `{}`): URL params object.
  * query (default: `{}`): query params object.
  * hash (default: `''`): URL hash.

##### go

API: `router.go(name: String, options?: URLOptions): void`

The method builds an URL using [RouterInternal#buildURL](#buildurl)
and navigates to it (using [History#pushState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method))
and re-renders the layout according to the new URL.

* `name`: name of the route which will be navigated to.
* `options`: see [RouterInternal#buildURL](#buildurl) options param.

##### redirect

API: `router.redirect(name: String, options?: URLOptions): void`

The method is the same as the previous one, except it uses [History#replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_replaceState()_method).

##### goToURL

API: `router.goToURL(url: String): void`

The method navigates to the url from the parameter using
[History#pushState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method)
and re-renders the layout according to the new URL.

##### redirectToURL

API: `router.redirectToURL(url: String): void`

The method is the same as the previous one, except it uses [History#replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_replaceState()_method).

##### pushURL

API: `router.pushURL(url: String): void`

The method pushes the url using [History#pushState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method)
without re-rendering the layout.

##### replaceURL

API: `router.replaceURL(url: String): void`

The method is the same as the previous one, except it uses [History#replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_replaceState()_method).

### RouteParams

This is a class with the following instance properties:

* name: route name
* host: see [Location API](https://developer.mozilla.org/en-US/docs/Web/API/Location)
* hostname: see [Location API](https://developer.mozilla.org/en-US/docs/Web/API/Location)
* href: see [Location API](https://developer.mozilla.org/en-US/docs/Web/API/Location)
* origin: see [Location API](https://developer.mozilla.org/en-US/docs/Web/API/Location)
* pathname: see [Location API](https://developer.mozilla.org/en-US/docs/Web/API/Location)
* port: see [Location API](https://developer.mozilla.org/en-US/docs/Web/API/Location)
* protocol: see [Location API](https://developer.mozilla.org/en-US/docs/Web/API/Location)
* search: see [Location API](https://developer.mozilla.org/en-US/docs/Web/API/Location)
* query: query params object
* params: URL params object
* hash: URL hash (without `#`)
* additionalParams: see [route object](#route-object) `path` option.

### Handling link clicks

The router listens to all link `click` events that reach `window`,
prevents the default behavior and uses the HistoryAPI to navigate
to the new URL.

If the link has a `disabled` attribute, the default behavior will
be prevented and nothing will happen.

If the link has a `no-routing` attribute, the link won't be used
by the Router (and the default behavior will stand).

If the link has a `replace` attribute, the URL that will be navigated
to will replace the previous URL (see [History#replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_replaceState()_method)).
