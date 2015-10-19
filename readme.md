Results
=======

[![Build Status](https://travis-ci.org/uniphil/results.svg)](https://travis-ci.org/uniphil/results)


Lightweight rust-inspired `Maybe`, `Result`, and `Union` program flow control for JavaScript -- with `match`!.


Install
-------

```bash
$ npm install results
```


Docs
----

API Docs: _coming soon_ -- they used to be auto-generated with typedoc, but now that typescript is gone, a better (possibly manual) solution is needed.


Features
--------

Rust-like `Maybe` and `Result` for nice data processing flows:

```javascript
var {Some, None, Ok, Err} = require('results');


function getLatest() {
  // this function might fetch data from a server or something, but we'll just
  // hard-code it for illustration
  return Some('{ "nums": [1, 7, 3, 3] }');
}


function parseJSON(raw) {
  try {
    return Ok(JSON.parse(raw));
  } catch (parseErr) {
    return Err(parseErr);
  }
}

function validate(data) {
  if (!(data.nums instanceof Array)) {
    return Err('nums property was not an Array');
  }
  if (!(data.nums.length > 0)) {
    return Err('nums array must have at least one number');
  }
  if (!data.nums.every((n) => typeof n === 'number')) {
    return Err('nums array should contain only numbers');
  }
  return Ok(data);
}

function summarize(data) {
  var total = data.nums.reduce((sum, val) => sum + val, 0),
      min = Math.min.apply(null, data.nums),
      max = Math.max.apply(null, data.nums),
      avg = total / data.nums.length;

  if ([total, min, max, avg].some(isNaN)) {
    console.log(data, total, min, max, avg);
    return Err('Math error -- found a NaN');
  }

  return Ok({total, min, max, avg});
}

function prettyPrint(data) {
  var pretty = JSON.stringify(data, null, 2);
  if (pretty === undefined) {
    return Err('prettyPrint failed :(');
  } else {
    return Ok(pretty);
  }
}

// We can now compose these functions with their nice methods:
function logLatestReport() {
  var latestReport = getLatest().okOr('Nothing new')
    .andThen(parseJSON)
    .andThen(validate)
    .andThen(summarize)
    .andThen(prettyPrint);

  latestReport.match({
    Ok: (report) => console.log(report),
    Err: (reason) => console.error(':(', reason),
  });
}

```
All of the methods for `Result` and `Option` (called `Maybe` in results) that make sense in JavaScript should be there.

Match expressions are almost like Rust with es6 arrow functions:

```javascript

var messageSent = Ok('sent!');  // or Err(why) as the case may be...

messageSent.match({
  Ok: (okMessage) => console.log(okMessage, 'woo hoo!'),
  Err: (why) => {
    console.error(why, ':(');
    notifyFailure('message sending', why);
  },
});

```

`Maybe` and `Result` are generalized as `Union` (which is a sort of Sum Type or Discriminated Union-ish tool). `Union` comes with the `match` expression for nice control flow everywhere:

```javascript
var _;  // just a placeholder to make the Union object declaration valid
var HTTPVerbs = Union({
  OPTIONS: _,
  HEAD: _,
  GET: _,
  POST: _,
  PUT: _,
  DELETE: _,
});


function isIdempotent(verb) {
  return verb.match({
    POST: () => false,
    _: () => true,      // `_` is catch-all, just like in rust!
  });
}

isIdempotent(HTTPVerbs.OPTIONS());
// => true

isIdempotent(HTTPVerbs.POST());
// => false

```

Methods, like the ones on `Result`s and `Maybe`s, can be attached when creating the `Union`:

```javascript
var _;
var HTTPVerbs = Union({
  OPTIONS: _,
  HEAD: _,
  GET: _,
  POST: _,
  PUT: _,
  DELETE: _,
}, {
  isIdempotent: function() {
    return this.name === 'POST' ? false : true;
  }
});

// or, since we are a method on the UnionOption, we can even use `match` in the method:
var _;
var HTTPVerbs = Union({
  OPTIONS: _,
  HEAD: _,
  GET: _,
  POST: _,
  PUT: _,
  DELETE: _,
}, {
  isIdempotent: function() {
    return this.match({
      POST: () => false,
      _: () => true,
    });
  }
});


HTTPVerbs.PUT().isIdempotent();
// => true

```


Changes
-------

Todo for v1.0.0:

 * [ ] Fix up API docs

 * [ ] Improve the readme
     * [ ] Get better examples
     * [ ] Add API docs


### v0.7.0

_in progress_

### Breaking

  * Removed the `.map` family of methods from `Result` and `Maybe` -- use
    `.andThen` (possibly chained with `.or` or `.orElse`) instead.
  * Removed `.array` from `Result` and `Maybe` proto. It came from rust's
    `.iter` and `.intoIter`, but it's not really useful in javascript...
  * `OptionClass` is now a reserved property for `Union` instances, so it can no
    longer be used as a key in Unions.
  * The typescript declaration file is removed. It could be re-created and added
    to definitelyTyped or something, if anyone wants it.
  * **Match's _ special-case catch-all key is removed**. Instead, `results` now
    exports a symbol as `_` that you can use as a computed key like
      ```js
      Union({A: {}, B: {}, C: {}}).A().match({
        A: () => console.log('A!'),
        [_]: () => console.log('something else...'),
      });

### Other Changes

  * `OptionClass`! Check which Union a value is coming from with `instanceof`
  * `Some` and `Ok` auto-promotion for the `.and` and `.or` families of methods,
    as well as `.all` on the union instances.
  * Added toString methods. Some samples: `'[Union { A, B }]'`,
    `'[[UnionOption A(1, 2) from Union { A }]]'`
  * `Maybe`'s prototype grew `.promiseOr` and `.promiseOrElse` methods.
  * `Result`'s prototype grew `.promise` and `.promiseErr` methods.
  * Converted source from typescript to es6 javascript, so we can use more es6
    features, and remove ugly typescript hacks.


### v0.6.0

2015-10-17

#### Breaking

  * Only allow object Enum definition (`Enum({ONE: {}, TWO: {}, THREE: {}})` only; no more
    `Enum(['ONE', 'TWO', 'THREE'])`).
  * Enum option instance property `options` is now an Object instead of Array.
  * Throw `Error` instances instead of special internal error enums. It was a silly idea.
  * Remove sketchy faulty object typecheck for the Enum constructor. It's just not checked now. Whee.
  * Add a `static` param to the `Enum` function (after `proto`) for adding
    stuff to the Enum.
  * Use the new `static` param to add a `.all` method to `Maybe` and `Result`,
    whose behaviour is close to that of `Promise.all`.
  * **`Enum` renamed to `Union`!** `enum` is another thing in JavaScript, so
    this is less confusing.
  * Remove the `take` method from `Some/None`.
  * **`.match` now throws** for unrecognized keys in a provided options object.

#### Other Changes

  * Fix typescript interfaces for ResultOption (props => methods)
  * Annotate `match` param and return
  * Upgrade typescript version


### v0.5.0

#### Breaking

  * `Option` is now called `Maybe`, since `Option` is a thing already.
  * `EnumOption.option` is now called `EnumOption.name`. thanks @mystor.
  * `EnumOption.args` is now called `EnumOption.data`. thanks @mystor.

#### Other Changes

  * Use typescript. Mostly for docs at this point.
  * Performance optimizations and stuff. Still not back to v0.3.0, but pretty lightweight and fast.
  * Faster `EnumOption.match` function, thanks @mystor!


### v0.4.0

  * Generalize `Result` and `Option` to be built from `Enum`, and make `Enum` public
  * Breaking change -- errors are now `EnumOption`s


### v0.3.0

2015-03-14

  * Rewrote constructors to be empty (or nearly-empty) functions with all the methods on the prototype. This required:
  * Breaking change -- the `match` functionality is now a method just like all the other functions. See the updated examples in the readme.


### v0.2.1

2015-03-14

  * `object-assign` is a real dependency, not a dev-dependency. It is now in the right place in `package.json`, so this library should work...


### v0.2.0

2015-03-14

  * `Err(errValue).orElse(fn)` now calls `fn` with `errValue`, as it does in rust.
  * and, `Err(errValue).unwrapOrElse(fn)` does the same.


### v0.0.3

2015-03-06

  * `Err(errValue).unwrap()` now throws with `UNWRAP_ERR` and `errValue`, more closely matching Rust's behaviour (and mor useful).
  * Likewise, `Some(value).unwrapErr()` now throws with `UNWRAPERR_SOME` and `value`, and
  * `None().unwrap()` now throws with `UNWRAP_NONE` and a message.
