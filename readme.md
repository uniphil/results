Results
=======

[![Build Status](https://travis-ci.org/uniphil/results.svg)](https://travis-ci.org/uniphil/results)


Lightweight rust-inspired `Result`s and `Option`s for JavaScript.


Install
-------

```bash
$ npm install results
```


Features
--------

Rust-like matching syntax with es6 arrow functions

```javascript
var {Some, None, Ok, Err} = require('results');


function mightFindAResult() {
  if (Math.random() > 0.5) {
    return Some(42);
  } else {
    return None();
  }
}


mightFindAResult().match({
  Some: (result) => { console.log('we got a result!', result); },
  None: () => { console.log('no results found :('); },
});



function parseVersion(header) {
  if (header.length < 1) {
    return Err('invalid header');
  } else if (header[0] === '1') {
    return Ok(1);
  } else if (header[0] === '2') {
    return Ok(2);
  } else {
    return Err('invalid header version: ' + header[0]);
  }
}


var docHeader = '1        ';

parseVersion(docHeader).match({
  Ok: (version) => { console.log('successfully parsed version:', version); },
  Err: (err) => { console.error('failed to parse version with message:', err); },
});

```

Pattern expression functions' return values are propagated

```javascript
function parseDocument(doc) {
  var header = doc.slice(0, 10),
      body = doc.slice(10);
  return parseVersion(header).match({
    Ok: (version) => {
      return parseBody(body).match({
        Ok: (content) => {version: version, content: content},
        Err: (err) => Err(err),
      });
    },
    Err: (err) => Err(err),
  });
}
```


Most of rust's Option and Result methods are also available

```javascript
function parseDocument(doc) {
  var header = doc.slice(0, 10),
      body = doc.slice(10);
  return parseVersion(header).andThen((v) =>
    parseBody(body).andThen((c) =>
      Ok({version: v, content: c})));
}
```


Changes
-------


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
