# ajaxer

Simple client AJAX Promise-based library. Heavily inspired by
 [axios](https://github.com/mzabriskie/axios).

## Installation

You can install ajaxer using npm:

```bash
$ npm install --save ajaxer
```

Also you have to use a module bundler
like [Webpack](http://webpack.github.io/ "Webpack")
or [Browserify](http://browserify.org/ "Browserify") or
 you can insert a script tag in you html like this:
 
```html
<script src="/node_modules/ajaxer/build/ajaxer.min.js"></script>
```

that defines global Ajaxer and ajaxer variables.

## Usage

`Ajaxer` is a class which instance is a function
 that simply calls `Ajaxer#request` with the same arguments.
`ajaxer` is a pure instance of `Ajaxer`.
Note that the library does not itself contain
 Promise implementation. You must explicitly set it using
 `Ajaxer.usePromise`.
 
## API

### Ajaxer class

##### new Ajaxer([config])

Returns: new instance of `Ajaxer`.

The method deep clones the default config, deep merges
 the config argument (if provided) into the clone and
 returns new instance of `Ajaxer`.
```js
import Ajaxer from 'ajaxer';

const ajaxer = new Ajaxer({
  baseURL: `${ location.origin }/api`
});
```

##### Ajaxer.usePromise(PromiseClass)

Call this function with the argument of the Promise class
 you want Ajaxer to use. It must be any Promise library
 that follows [Promises/A+ specs](https://promisesaplus.com/).
```js
import Promise from 'bluebird';
import Ajaxer from 'ajaxer';

Ajaxer.usePromise(Promise);
```

### Ajaxer instance

##### ajaxer([url][,config])

Alias for `Ajaxer#request`.

##### Ajaxer#delete([url][,config])
##### Ajaxer#get([url][,config])
##### Ajaxer#head([url][,config])
##### Ajaxer#patch([url][,data][,config])
##### Ajaxer#post([url][,data][,config])
##### Ajaxer#put([url][,data][,config])

Shorthands for `Ajaxer#request`. Note that config
 url, method and data config properties may overwrite
 the ones that provided in the arguments.

##### Ajaxer#after(middleware, afterAll=true)

Returns: `this`.

Method for adding "after" middleware which is called after
 each request. If the function takes at least two arguments
 the middleware is considered an error middleware (which is
 called only if there was an error) and is called
 with the error and the request config arguments otherwise
 it's called only with the config argument (only when
 there is no error).
 The second argument is a boolean flag where to put
 the middleware: truthy stands for
 "after all other after middlewares" and falsey for
 "before all other after middlewares".
```js
import { ajaxer } from 'ajaxer';

ajaxer
  .after((res) => {
    res.json = JSON.parse(res.data);
  })
  .after((err, res) => {
    console.log(err, res);

    // throw the error in order to continue rejecting the promise
    // err.response contains the response
    // err.type can be 'ABORT_ERROR', 'TIMEOUT_ERROR'
    // or 'NETWORK_ERROR'
    throw err;
  });
```

##### Ajaxer#before(middleware, beforeAll=true)

Returns: `this`.

Method for adding "before" middleware which is called before
 each request. If the function takes at least two arguments
 the middleware is considered an error middleware (which is
 called only if there was an error) and is called
 with the error and the response arguments otherwise
 it's called only with the response argument (only when
 there is no error).
 The second argument is a boolean flag where to put
 the middleware: truthy stands for
 "before all other before middlewares" and falsey for
 "after all other before middlewares".
```js
import { ajaxer } from 'ajaxer';

ajaxer
  .before((config) => {
    if (config.url === '/long-request') {
      config.timeout = 10000;
    }
  }, false)
  .before((err, config) => {
    console.log(err, config);

    // throw the error in order to continue rejecting the promise
    throw err;
  });
```

##### Ajaxer#config(property, value)
##### Ajaxer#config(config)
##### Ajaxer#config(configCallback)
##### Ajaxer#config()

Returns: if the method called with no arguments
 the config is returned otherwise `this` is returned.

If the method is called with no arguments the config
 returned.
If the method is called with one function argument
 it's called with the config argument.
If the method is called with one argument
 the argument is deep merged into the ajaxer config.
If the method is called with two arguments the
 property with the provided value is deep merged into the
 ajaxer config.
```js
import { ajaxer } from 'ajaxer';

ajaxer.config({
  timeout: 5000
});

ajaxer.config((config) => {
  console.log(config.timeout); // 5000
});

ajaxer.config('timeout', 10000);

console.log(ajaxer.config().timeout); // 10000
```

##### Ajaxer#headers(header ,value)
##### Ajaxer#headers(headers)

Returns: `this`.

If the method is called with one argument
 the argument is assigned to the ajaxer config headers.
If the method is called with two arguments the
 header with the provided value is assigned to the
 ajaxer config headers.
```js
import { ajaxer } from 'ajaxer';

ajaxer.headers('X-Requested-With', 'XMLHttpRequest');

ajaxer.config((config) => {
  console.log(config.headers['X-Requested-With']); // 'XMLHttpRequest'
});

ajaxer.headers({
  'Custom-Header': 'Value'
});

ajaxer.config((config) => {
  console.log(config.headers['Custom-Header']); // 'Value'
});
```

##### Ajaxer#instance([config])

Returns: new instance of `Ajaxer`.

The method deep clones the ajaxer instance config,
 deep merges the config argument (if provided) into
 the clone and returns new instance of `Ajaxer`.
```js
import { ajaxer } from 'ajaxer';

const instance = ajaxer.instance({
  baseURL: `${ ajaxer.config().baseURL }/users`
});
```

##### Ajaxer#request([url][,config])

Returns: `Promise.<Response, Error>`.

Method that does all the requests. Usually it's not needed
 to be called explicitly.
Note that url property may be overwritten by the config.
Also note that the promise is not rejected depending on
 the status code - you have to explicitly throw an error
 in an "after" middleware (see Ajaxer#after).

```js
import { ajaxer } from 'ajaxer';

ajaxer
  .request('/url', {
    timeout: 2000
  })
  .then((res) => {
    // do something with the response
  })
  .catch((err) => {
    // do something with the error
    // err.response contains the response
    // err.type can be 'ABORT_ERROR', 'TIMEOUT_ERROR'
    // or 'NETWORK_ERROR'
  });
```

### Ajaxer config

Default config is
```js
const defaultConfig = {
  // you shouldn't change this explicitly
  // use Ajaxer#after for adding middlewares
  after: [],
  
  // auth object
  auth: {
    username: '',
    password: ''
  },
  
  // base url of the request
  baseURL: location.origin,
  
  // you shouldn't change this explicitly
  // use Ajaxer#before for adding middlewares
  before: [],
  
  // request data (only for patch, post and put requests)
  data: null,
  
  // request headers
  headers: {},
  
  // request method
  method: 'get',
  
  // request URL params (that replace strings like :userId
  // in an URL like '/user/:userId')
  params: {},
  
  // request query params, ajaxer serializes query
  // params itself
  query: {},
  
  // xhr responseType param
  responseType: '',
  
  // xhr timeout param
  timeout: 0,
  
  // request url
  url: '',
  
  // xhr withCredentials param
  withCredentials: false
};
```

### Ajaxer response

Response example:

```js
const response = {
  // request config
  config: {},
  
  // response data (not transformed)
  // for transformation provide an "after" middleware
  // (see Ajaxer#after)
  data: '',
  
  // response headers
  headers: {},
  
  // response status
  status: 200,
  
  // response status text
  statusText: 'OK',
  
  // XMLHttpRequest original object
  xhr: xhr
};
```
