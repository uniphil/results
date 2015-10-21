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

### `Union(options[, proto[, static_[, factory]]])`

Creates a discriminated union with members specified in the `options` object.

Returns a `union` object.

- **`options`** An object defining the members of the set. One member is added
  for each key of `options`, and the values are ignored. Almost any name can be
  used for the members except for two reserved names:
  - `toString`, which is automatically added for nicer debugging, and
  - `OptionClass`, which is used to attach the constructor function for member
    instances, for typechecking purposes.
  **Union() will throw** if either of those names are used as members in
  `options`.

  `Maybe.None()` is an example of a member added via `options`.

- **`proto`** will be used to set the protoype of member instances. `match` and
  `toString` will automatically be added to the prototype by default, but if you
  define those in `proto` they will override the built-in implementations.

  `Result.Ok(1).toPromise()` is an example of a method attached through `proto`.

- **`static_`** like `proto` but for the object returned by `Union()`: functions
  defined here can inspect the union, like accessing `this.OptionClass`. By
  default, `toString` is added for you, but defining it in `static_` will
  override the default implementation.
  **Union() will throw** if a key in `static_` already exists in `options`.

  `Result.all()` is an example of a function attached through `static_`.

- **`factory`** is not stable and should not be considered part of the public
  API :) It is used internally by `Maybe` and `Result`, check the source if you
  want to get down and dirty.


#### `Union._` the catch-all symbol

A reference to a symbol you can import and use as a computed property
(`{[computedProp]: val}`) in a `match` to handle any unmatched paths.

Since `Union._` is a symbol, you technically _can_ also have `'_'` as a member
of a union. But please don't :)


```js
import { Union, _ } from 'results';
const Stoplight = Union({  // Union(), creating a `union` object called StopLight.
  Red: {},
  Amber: {},
  Green: {}
});
Stoplight.Green().match({
  Red: () => console.error('red'),
  Amber: () => console.warn('amber'),
  [_]: () => console.info('any other colour')  // The wildcard symbol reference "_" used via a computed property
});
```

#### `union` object

Created by `Union()`, this is an object with a key for each member of the union,
plus anything attached via `static_`, which include `OptionClass` and `toString`
by default. It is not safe to iterate the keys of a `union` object.

Each member name's key maps to a factory to create a member instance, from a
constructor called `OptionClass` (whose reference is also attached to the
`union` object via they key "OptionClass").


### `OptionClass()` constructor

A function for creating OptionClass instances. You should not call this
constructor directly, but rather use one of the factories attached to the
`union` object via keys named after the union's members.

In the `Stoplight` example above, the following is ok:

```js
assert(Stoplight.Green() instanceof Stoplight.OptionClass)
```


#### `OptionClassFactory(...payloads)` functions

Attached to `union` objects by keys named after the union's members. These
functions create the "values" used in result. `Maybe.Some()`, `Maybe.None()`,
`Result.Ok()`, and `Result.Err()` are all OptionClass factories. In the
`Stoplight` example above, `Stoplight.Green` is an OptionClassFactory.

- **`payloads`** Zero or more arguments of any type can be passed as params.
  They will be stored on the `OptionClass` instance, and are accessible via
  `.match` callbacks, or as through properties on `OptionClassInstance`s.


#### `OptionClassInstance` objects

The values that are usually passed around when using Results. They have three
properties that are public, but it is recommended that you _only_ access these
properties via methods on the object, like the default `match` method provided
for every union, or methods you passed to `Union()` via the `proto` param. The
property names are:

- **`.options`** A reference to the object used to create the union with
  `Union()`. You can inspect its keys to find the members of this instance's
  union.
- **`.name`** The member name of this OptionClass instance.
  `Maybe.None().name === 'None'`.
- **`.data`** All payloads provided to `OptionClassFactory` in an array.
  `Stoplight.Red(1, 2, 3).data` is `[1, 2, 3]`.


### `match(to)` method

Automatically attached to every `OptionClassInstance`, `.match` is a better way
to control program flow depending on which member of Union you are dealing with.

- **`to`** an object, mapping member names to callback functions. The object
  _either_ exhaustively cover all members in the Union with callbacks, _or_
  map zero or more members to callbacks and provide a catch-all callback for
  the symbol `_`, exported by Results. If the coverage is not exhaustive, or
  if unrecognized names are included as keys, `.match` will throw.

  `.match` will call the matching callback passing params as defined below, and
  synchronously returning the result of the callback.

  - callback for _member name_ keys: a function. It will be passed any payloads
    provided to `OptionClassFactory` as params.

  - callback for the _catch-all key "_`_`_"_: a function. It will be provided
    a single param, the `OptionClassInstance`.


### `Maybe` -- `[Union { Some, None }]`

An optional type.

#### `Maybe.Some(payload)`

Also exported as `Some` from Results (`import { Some } from 'results';`).

- **`payload`** A single parameter of any type.

#### `Maybe.None()`

Also exported as `None` from Results (`import { None } from 'results';`).
Accepts no parameters

#### Prototype methods on Maybe (available on any instance of Some or None)

##### `match(paths)`

defers to `match` (see above), but will only pass a single payload parameter to
a callback for Some (no parameters are passed to a None callback).

##### `isSome()` and `isNone()`

What you would hopefully expect :)

```js
import { Some, None } from 'results';
assert(Some(1).isSome() && !Some(1).isNone());
assert(!None().isSome() && None().isNone());
```

##### `unwrap()`

Get the payload of a `Some()`, **or throw if it's `None()`**.

##### `expect(err)`

Like `unwrap()`, but throws a custom error if it is `None()`.

- **`err`** The error to throw if it is `None()`

```js
import { Some, None } from 'results';
const n = Some(1).unwrap();  // n === 1
const m = None().unwrap();  // throws an Error instance
const o = Some(1).expect('err')  // o === 1
const p = None().expect('err')  // throws 'err'
```

##### `unwrapOr(def)`

Like `unwrap()`, but returns `def` instead of throwing for `None()`

- **`def`** A default value to use in case it's `None()`

##### `unwrapOrElse(fn)`

Like `unwrapOr`, but calls `fn()` to get a default value for `None()`

- **`fn`** A callback accepting no parameters, returning a value for `None()`

```js
import { None } from 'results';
const x = None().unwrapOr('z');  // x === 'z';
const y = None().unwrapOrElse(() => new Date());  // y === the current date.
```

##### `okOr(err)`

Get a `Result` from a `Maybe`

- **`err`** an error payload for `Err()` if it's `None()`

##### `okOrElse(errFn)`

- **`errFn`** a callback to get a payload for `Err()` if it's `None()`

```js
import { Some, None } from 'results';
assert(Some(1).okOr(2).isOk() && None().okOr(2).isErr());
assert(None().okOrElse(() => 3).unwrapErr() === 3);
```

##### `promiseOr(err)` and `promiseOrElse(errFn)`

Like `okOr` and `okOrElse`, but returning a resolved or rejected promise.

```js
import { Some, None } from 'results';
// the following will log "Some"
Some(1).promiseOr(2).then(d => console.log('Some'), e => console.error('None!'));
None().promiseOrElse(() => 1).catch(err => console.log(err));  // logs 1
```

##### `and(other)` and `or(other)`

- **`other`** `Some()` or `None()`, or any value of any type which will be
  wrapped in `Some()`.

Analogous to `&&` and `||`:

```js
import { Some, None } from 'results';
Some(1).and(Some(2));  // Some(2)
Some(1).and(None());  // None()
None().and(Some(2));  // None()
Some(1).or(Some(2)).or(None());  // Some(1)
None().or(Some(1)).or(Some(2)); // Some(1);
```

##### `andThen(fn)`

Like `and`, but call a function instead of providing a hard-coded value. If `fn`
returns a raw value instead of a `Some` or a `None`, it will be wrapped in
`Some()`.

- **`fn`** If called on `Some`, `fn` is called with the payload as a param.

##### `orElse(fn)`

Like `andThen` but for `Err`s.

- **`fn`** If called on `Err`, `fn` is called with the Error payload as a param.

Since `andThen`'s callback is only executed if it's `Some()` and `orElse` if
it's `None`, these two methods can be used like `.then` and `.catch` from
Promise to chain data-processing tasks.


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
