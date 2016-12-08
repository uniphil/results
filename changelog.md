Changes
=======

### v0.14.1

2016-12-08

#### New features

  * Add Maybe.prototype.filter(fn) for chaining in conditionals to payload
    processing


### v0.14.0

2016-05-31

#### Breaking changes

  * `options` is now a reserved key that can't be used as a union member.


### v0.13.0

2016-03-23

Version 13 introduces a bunch of breaking changes, without deprecation warnings.
Version 12 is still stable, so if you depend on stuff that's changing, you don't
have to upgrade.

The changes are based off of close to half a year of full-time work building
[OpenRide](https://openride.co) with lots of our data wrapped up in Results
instances. I think all of it takes results in a better direction.


#### Enhancements

  * Improved error reporting for "match called on non-member option"

    ```
    UnionError: match called on a non-member option: '[A(42) from Union{ A, B }]'. Expected a member from { X, Y }'
    ```

#### Breaking changes

  * `UnionError` is gone. Results now just throws `Error`s.

  * Unions now only accept a single payload param.
    * Unions now store that payload at `instance.payload` instead of as an array
      in `instance.data`. You really shouldn't be accessing `instance.data`
      directly anyway, but if you do, this change breaks that.
    * Implementing custom factories will also be broken -- please pass back the
      raw `value` for payload instead of wrapping it in an Array.


### v0.12.3

2016-01-29

#### Bug Fix

  * `Maybe.all` and `Promise.all` should not flatten arrays in their `Some`s and
    `Ok`s. Now they don't.

### v0.12.2

2016-01-12

#### Bug Fix

  * `UnionError` should have passed `instanceof Error` checks. Now they do.


### v0.12.1

2016-01-12

#### Bug Fix

  * Return false for `Union({A:1}).A().equals(Immutable.Map())` instead of
    recursing infinitely.


### V0.12.0

2015-11-15

#### New features

  * Added static method `Maybe.nan`, like `Maybe.undefined` and `Maybe.null`.
  * Added missing `.expect()` method to `Result`.

#### Breaking changes

  * The `_` symbol for match catch-all has been removed, after being deprecated
    since v0.10. The string `'_'` is now reserved and cannot be used as a Union
    member option, and is the way to do catch-all matches going forward.

    Before:
    ```js
    import { Maybe, Some, _ } from 'results';
    Maybe.match(Some(1), {
      Some: n => console.log('some', n),
      [_]: () => console.log('not some')
    });
    ```
    Going forward:
    ```js
    import { Maybe, Some } from 'results';
    Maybe.match(Some(1), {
      Some: n => console.log('some', n),
      _: () => console.log('not some')
    });
    ```

  * `Err(payload).unwrap()` now throws `payload` instead of a `UnionError`.

  * `.match`'s `_` catch-all handler now gets all the union option payloads
    applied to it instead of just passing in the union option itself. Passing in
    the union option was pretty useless, since you already have a ref to it if
    you can call `.match` in the first place, and accessing it's `.data` array
    was a little sketch.

    For Unions where all options accept the same kind of payload, accepting it
    as a argument to the catch-all handler can be pretty useful, even if it's
    maybe a little unsafe in general.


### v0.11.0

2015-11-13

#### New features

  * Added a static `.is(first, second)` function to `Union` for deep equality
    testing.
  * Added `.equals` proto method to all union option instances
  * Added `.hashCode` proto method to all union option instances (currently
    always returns `42`).
  * These methods are equivalent to and compatible with ImmutableJS

#### Breaking fixes

  * Union options instances' `.constructor` property is now a reference to its
    union's `OptionClass`, as it always should have been. Before this release
    it was `Object`. This shouldn't break anything unless you're doing _really_
    weird stuff :)


### v0.10.0

2015-11-02

#### New features

  * Added static methods `Result.try`, `Maybe.undefined`, and `Maybe.null` for
    plain-js interop. See the docs for details.
  * All errors thrown are now instances of `Result.Error`, which should still
    pass any `(err instanceof Error)` checks, so hopefully nothing breaks :)

#### Breaking changes

  * Deprecating the `_` symbol has a breaking edge-case: A match from a union
    containing a member called `"_"` that _also_ has a wild-card member `[_]`
    (the symbol), will always take the `"_"` path instead of the catch-all
    symbol path. I'm fairly confident this affects zero people.

#### Deprecations

  * The symbol exported from results as `_` is now deprecated. To do a catch-all
    match, just use a normal `'_'` string key. For a cost of having one more
    reserved member name (never ever used?), catch-all matching (frequently
    used) is (back to) much more convenient.

#### Other changes

  * Improved the error message when a property in a `.match` object is not a
    function. It used to throw complaining that the prop was missing. Now it
    says that the prop is the wrong type.


### v0.9.0

2015-10-27

#### Breaking

  * **Result.Ok(value)** now **returns** `value` if it is an instance of
    `Result.OptionClass`, instead of unwrapping and rewrapping as `Ok`, and
  * **Maybe.Some(value)** now **returns** `value` if it's a `Maybe.OptionClass`,
    instead of unwrapping and rewrapping as `Some`. These changes are included
    to provide a way to "cast" arbitrary values to Result or Maybe, mirroring
    `Promise.resolve(value)`.


### v0.8.0

2015-10-21

#### Breaking

  * **.match is no longer a proto method**. It is now a static method living on
    the Union, like `.all` for Result and Maybe. It now takes two parameters:
    the first one being the instance to match against, and the second being the
    object defining the match handlers.

    ```js
    import { Some, None, Maybe } from 'results';

    // BEFORE (<= v0.7)
    Some(1).match({
      Some: n => console.log('some!', n),
      None: () => console.log('none :(')
    });

    // AFTER (>= v0.8)
    Maybe.match(Some(1), {
      Some: n => console.log('some!', n),
      None: () => console.log('none :(')
    });
    ```


### v0.7.0

2015-10-21

#### Breaking

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

#### Other Changes

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
