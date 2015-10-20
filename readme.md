Results [![Build Status](https://travis-ci.org/uniphil/results.svg)](https://travis-ci.org/uniphil/results)
=======

Results brings **Discriminated Unions** (aka **Sum Types** or **Algebraic Types**) to JavaScript, with **`match`** for better program flow control.

Results ships with full-featured **`Maybe`** (sometimes called an **Option Type**) and **`Result`** unions built-in, helping you safely deal with optional data and error handling.

The goal of Results is **JavaScript with fewer bugs**.


Install
-------

```bash
$ npm install results
```


Quickstart
----------

#### `Result` for error handling

```js
import { Result, Ok, Err } from 'results';

function validateNumber(number) {
  if (isNaN(number)) {
    return Err(`expected a number but got '${number}' (a '${typeof number}')`);
  } else {
    return Ok(number);
  }
}

function computeSum(numbers) {
  if (!(numbers instanceOf Array)) {
    return Err(`expected an Array but got '${numbers}' (a '${typeof numbers}')`);
  }
  return Result.all(numbers.map(validateNumber))
    .andThen(nums => nums.reduce((a, b) => a + b));
}

// Since computeSum returns a Result (eiter an Err() or an Ok()), we can match
// for it and handle all possible cases:
computeSum([1, 2, 3, 4, -5]).match({
  Ok: sum => console.log(`The sum is: ${sum}`),
  Err: err => console.error(`Something went wrong: ${err}`)
});

// Result is a synchronous compliment to Promise, and plays nicely with it:
fetch('http://example.com/numbers')
  .then(resp => resp.json())
  .then(nums => computeSum(nums).toPromise())
  .then(sum => console.log(`The sum is: ${sum}`))
  .catch(err => console.error(`Something went wrong: ${err}`));
```

#### `Maybe` for nullable references

```js
import { Maybe, Some, None } from 'results';

// Take a tree of Maybe({val: any, left: Maybe, right: Maybe}) and flatten it
// into an array of values:
function flattenDepthFirst(root) {
  return root.match({
    None: () => [],
    Some: node => [node.val]
                    .concat(flattenDepthFirst(node.left))
                    .concat(flattenDepthFirst(node.right))
  });
}
```

#### `Maybe` for default values and possibly-undefined return values

```js
import { Maybe, Some, None } from 'results';

function printGreeting(name) {
  // get the name, or set a default if name is None()
  const nameToPrint = name.match({
    Some: n => n,
    None: () => 'friend'
  });
  console.log(`Hello, oh wonderful ${nameToPrint}!`);
}

// The Maybe union has helpful methods, like .unwrapOr for getting the value
// with a default:
function printGreeting(name) {
  const nameToPrint = name.unwrapOr('friend');
  console.log(`Hello, oh wonderful ${nameToPrint}!`)
}

// For functions whose result may not be defined, using Maybe encourages the
// caller to handle all cases
function get(obj, key) {
  if (obj.hasOwnProperty(key)) {
    return Some(obj[key]);
  } else {
    return None();
  }
}
```

#### `Union` as a powerful Enum

```js
import { Union, _ } from 'results';

const HTTPVerbs = Union({
  Options: {},  // the {} values are just place-holders, only the keys are used
  Head: {},
  Get: {},
  Post: {},
  Put: {},
  Delete: {}
}, {
  // the optional second object parameter to Union creates prototype methods:
  isIdempotent() {
    return this.match({
      Post: () => false,
      [_]: () => true  // "_" is a Symbol to be used as a catch-all in match
    });
  }
});

let myVerb = HTTPVerbs.Get();
console.log(`Get ${myVerb.isIdempotent() ? 'is' : 'is not'} idempotent.`);
// => "Get is idempotent"
myVerb = HTTPVerbs.Post();
console.log(`Post ${myVerb.isIdempotent() ? 'is' : 'is not'} idempotent.`);
// => "Post is not idempotent"

myVerb.match({
  Delete: () => console.warn('some data was deleted!'),
  [_]: () => null
});
```

While there is nothing react-specific in Results, it does enable some nice patterns:

```js
import React from 'react';
import { Union } from 'results';

const AsyncState = Union({
  Pending: {},
  Success: {},
  Failed: {}
});

class Spinner extends React.Component {
  static propTypes = {
    reqState: React.PropTypes.instanceOf(AsyncState.OptionClass)
  }
  render() {
    return this.props.reqState.match({
      Pending: loaded => (
        <div className="spinner overlay spinning">
          <div className="spinner-animation">
            Loading {loaded}%...
          </div>
        </div>
      ),
      Failed: errMsg => (
        <div className="spinner overlay failed">
          <div className="spinner-err-message">
            <h3>Failed to load :( </h3>
            <p>{errMsg}</p>
          </div>
        </div>
      ),
      Success: <div style={{display: 'none'}}></div>
    });
  }
}
```

API
---
_coming soon..._


Credits
-------

Results is written and maintained by [uniphil](https://github.com/uniphil/),
with help, support, and opinions from [mystor](https://github.com/mystor/).

The APIs for `Maybe`, and `Result` are _heavily_ influenced by
[rust](https://www.rust-lang.org/)'s
[`Option`](https://doc.rust-lang.org/std/option/) and
[`Result`](https://doc.rust-lang.org/std/result/).


Changes
-------


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
    ```

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
  * Rewrote the readme with hopefully better content :) Still lots more to
    improve!


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
