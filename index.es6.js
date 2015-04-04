/**
 * Rust-inspired Result<T, E> and Option<T> wrappers for Javascript.
 *
 * @module results
 * @requires object-assign
 *
 * @author mystor
 * @author uniphil
 */

/**
 * Any user-provided value, including `undefined`
 * @typedef {T} value
 * @template T
 */

/**
 * Any user-provided throwable error, including `undefined`
 * @typedef {E} err
 * @template E
 */

/**
 * @callback valueCb
 * @param {value} value
 * @returns {value}
 */

/**
 * @callback errCb
 * @param {err} err
 * @returns {value}
 */

/**
 * @callback OptionCb
 * @param {value} value
 * @returns {Option}
 */


var assign = require('object-assign');

function covers(/*Array:*/ options, /*Object:*/ paths) {
  return paths.hasOwnProperty('_') ? true :
    options.every((opt) => paths.hasOwnProperty(opt)) &&
    options.length === Object.keys(paths).length;
}

function match(paths) {
  if (!covers(this.options, paths)) { throw EnumErr.NonExhaustiveMatch(); }
  return paths.hasOwnProperty(this.option) ?
    paths[this.option](this.value) :
    paths['_'](this.option, this.value);
};

function Enum(options, proto) {
  if (!options) { throw EnumErr.MissingOptions(); }
  if (!(options instanceof Array)) {
    if (options instanceof Object) {
      options = Object.keys(options);
    } else {
      throw EnumErr.BadOptionType();
    }
  }
  function EnumOption(options, option, val) {
    this.options = options;
    this.option = option;
    this.value = val;
  }
  EnumOption.prototype = assign({match}, proto);
  return options.reduce((obj, opt) => {
    obj[opt] = (val) => new EnumOption(options, opt, val);
    return obj;
  }, {});
}

var EnumErr = Enum({
  MissingOptions:     null,
  BadOptionType:      null,
  NonExhaustiveMatch: null,
});


var OptionError = Enum({
  UnwrapNone: null,
});


/**
 * @class
 * @example
 * function find(arr, test) {
 * for (var i=0; i<arr.length; i++) {
 *   if (test(arr[i])) {
 *     return Some(arr[i]);
 *   }
 *   return None();
 * }
 */
var Option = Enum(['Some', 'None'], {

  /**
   * @example
   * assert(Some(42).isSome() === true);
   * assert(None().isSome() === false);
   * @returns {boolean}
   */
  isSome() {
    return this.option === 'Some';
  },

  /**
   * @example
   * assert(Some(42).isNone() === false);
   * assert(None().isNone() === true);
   * @returns {boolean}
   */
  isNone() {
    return this.option === 'None';
  },

  /**
   * @example
   * assert(Some(42).expect('nope') === 42);
   * try {
   *   None().expect('nope');
   * } catch (e) {
   *   assert(e === 'nope');
   * }
   * @param {err} err - the error to throw if the Option is None
   * @throws {err} The error privded as a param
   * @returns {value}
   */
  expect(err) {
    if (this.option === 'Some') {
      return this.value;
    } else {
      throw err;
    }
  },

  /**
   * @example
   * assert(Some(42).unwrap('nope') === 42);
   * var answer;
   * try {
   *   None().unwrap();
   * } catch (e) {
   *   answer = 'forty-two';
   * }
   * assert(anser === 'forty-two');
   * @throws Error.UnwrapNone
   * @returns {value}
   */
  unwrap() {
    if (this.option === 'Some') {
      return this.value;
    } else {
      throw OptionError.UnwrapNone('Tried to unwrap None');
    }
  },

  /**
   * @param {value} def - A default value to return if the Option is None
   * @returns {value}
   */
  unwrapOr(def) {
    return (this.option === 'Some') ? this.value : def;
  },

  /**
   * @param {valueCb} fn - A function to call to obtain a value to return if the Option is None
   * @returns {value}
   */
  unwrapOrElse(fn) {
    return (this.option === 'Some') ? this.value : fn();
  },

  /**
   * @param {OptionCb} fn - A function to call on the value wrapped by Some
   * @returns {Option}
   */
  map(fn) {
    return (this.option === 'Some') ? Option.Some(fn(this.value)) : this;
  },

  /**
   * @param {value} def - A default value to return for None
   * @param {valueCb} fn - A function to apply to a Some's value
   * @returns {value}
   */
  mapOr(def, fn) {
    return (this.option === 'Some') ? fn(this.value) : def;
  },

  /**
   * @param {valueCb} defFn
   * @param {valueCb} fn
   * @returns {value}
   */
  mapOrElse(defFn, fn) {
    return (this.option === 'Some') ? fn(this.value) : defFn();
  },

  /**
   * @param {err} err
   * @returns {Result}
   */
  okOr(err) {
    return (this.option === 'Some') ? Result.Ok(this.value) : Result.Err(err);
  },

  /**
   * @param {errCb} errFn
   * @returns {Result}
   */
  okOrElse(errFn) {
    return (this.option === 'Some') ? Result.Ok(this.value) : Result.Err(errFn());
  },

  /**
   * @returns {Array<value>}
   */
  array() {
    return (this.option === 'Some') ? [this.value] : [];  // .iter; .into_item
  },

  /**
   * @param {Option} other
   * @returns {Option}
   */
  and(other) {
    return (this.option === 'Some') ? other : this;
  },

  /**
   * @param {OptionCb} fn
   * @returns {Option}
   */
  andThen(fn) {
    return (this.option === 'Some') ? fn(this.value) : this;
  },

  /**
   * @param {Option} other
   * @rturns {Option}
   */
  or(other) {
    return (this.option === 'Some') ? this : other;
  },

  /**
   * @param {OptionCb} fn
   * @returns {Option}
   */
  orElse(fn) {
    return (this.option === 'Some') ? this : fn();
  },

  /**
   * @returns {Option}
   */
  take() {
    if (this.option === 'Some') {
      var taken = Option.Some(this.value);
      this.value = undefined;
      this.option = 'None';
      return taken;
    } else {
      return Option.None();
    }
  },
});


var ResultError = Enum({
  UnwrapErrAsOk: null,
  UnwrapErr: null,
});

var Result = Enum(['Ok', 'Err'], {
  isOk() {
    return this.option === 'Ok';
  },
  isErr() {
    return this.option === 'Err';
  },
  ok() {
    return (this.option === 'Ok') ? Option.Some(this.value) : Option.None();
  },
  err() {
    return (this.option === 'Ok') ? Option.None() : Option.Some(this.value);
  },
  map(fn) {
    return (this.option === 'Ok') ? Result.Ok(fn(this.value)) : this;
  },
  mapErr(fn) {
    return (this.option === 'Ok') ? this : Result.Err(fn(this.value));
  },
  array() {
    return (this.option === 'Ok') ? [this.value] : [];  // .iter; .into_item
  },
  and(other) {
    return (this.option === 'Ok') ? other : this;
  },
  andThen(fn) {
    return (this.option === 'Ok') ? fn(this.value) : this;
  },
  or(other) {
    return (this.option === 'Ok') ? this : other;
  },
  orElse(fn) {
    return (this.option === 'Ok') ? this : fn(this.value);
  },
  unwrapOr(def) {
    return (this.option === 'Ok') ? this.value : def;
  },
  unwrapOrElse(fn) {
    return (this.option === 'Ok') ? this.value : fn(this.value);
  },
  unwrap() {
    if (this.option === 'Ok') {
      return this.value;
    } else {
      throw ResultError.UnwrapErr(this.value);
    }
  },
  unwrapErr() {
    if (this.option === 'Ok') {
      throw ResultError.UnwrapErrAsOk(this.value);
    } else {
      return this.value;
    }
  },
});


module.exports = {
  Enum,

  Option,
  Some: Option.Some,
  None: Option.None,

  Result,
  Ok: Result.Ok,
  Err: Result.Err,
};
