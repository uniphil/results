Results
=======

[![Build Status](https://travis-ci.org/uniphil/results.svg)](https://travis-ci.org/uniphil/results)


Rust-inspired Result and Option type-ish tools for JavaScript.


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


mightFindAResult()({
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

parseVersion(docHeader)({
  Ok: (version) => { console.log('successfully parsed version:', version); },
  Err: (err) => { console.error('failed to parse version with message:', err); },
});

```

Pattern expression functions' return values are propagated

```javascript
function parseDocument(doc) {
  var header = doc.slice(0, 10),
      body = doc.slice(10);
  return parseVersion(header)({
    Ok: (version) => {
      return parseBody(body)({
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
