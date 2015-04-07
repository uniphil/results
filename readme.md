Results
=======

[![Build Status](https://travis-ci.org/uniphil/results.svg)](https://travis-ci.org/uniphil/results)


Lightweight rust-inspired `Option`, `Result`, and `Enum` program flow control for JavaScript.


Install
-------

```bash
$ npm install results
```


Docs
----

[API Docs](http://uniphil.github.io/results/)


Features
--------

Rust-like `Option` and `Result` for nice data processing flows:

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
All of the methods for `Result` and `Option` that make sense in JavaScript should be there.

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

`Option` and `Result` are generalized as `Enum` (which is a sort of Sum Type or Discriminated Union-ish tool). `Enum` comes with the `match` expression for nice control flow everywhere:

```javascript

var HTTPVerbs = Enum([
  'OPTIONS',
  'HEAD',
  'GET',
  'POST',
  'PUT',
  'DELETE',
]);


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

Methods, like the ones on `Result`s and `Option`s, can be attached when creating the `Enum`:

```javascript
var HTTPVerbs = Enum([
  'OPTIONS',
  'HEAD',
  'GET',
  'POST',
  'PUT',
  'DELETE',
], {
  isIdempotent: function() {
    return this.option === 'POST' ? false : true;
  }
});

// or, since we are a method on the EnumOption, we can even use `match` in the method:

```javascript
var HTTPVerbs = Enum([
  'OPTIONS',
  'HEAD',
  'GET',
  'POST',
  'PUT',
  'DELETE',
], {
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

 * [ ] Make errors nice.
     * [ ] Can we do nice things with the stack trace?
     * [x] What's the nicest thing we could be throwing? _EnumOptions!_

 * [ ] Maaaaaaybe add some methods like `.equals` and `.toString`

 * [ ] Fix up jsdoc API docs

 * [ ] Improve the readme
     * [ ] Get better examples
     * [ ] Add API docs


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
