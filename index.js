"use strict";

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

var assign = require("object-assign");

var $; // key mirror
var errors = (function (s) {
  return Object.keys(s).reduce(function (o, k) {
    o[k] = k;return o;
  }, {});
})({
  MISSING_CASE: $,
  UNWRAP_NONE: $,
  UNWRAPERR_OK: $,
  UNWRAP_ERR: $ });
function error(errKey, message) {
  return {
    key: errKey,
    message: message,
    toString: function toString() {
      return this.key + ": " + (JSON.stringify(this.message) || this.message);
    } };
}

/**
 * @private
 * @param {Array<string>} props - What properties must @obj have?
 * @param {Object} obj - The object whose properties we are checking for.
 */
function mustHave(props, obj) {
  if (!props.every(Object.prototype.hasOwnProperty.bind(obj))) {
    var missingKeys = props.filter(function (k) {
      return !obj.hasOwnProperty(k);
    }).join(", ");
    throw error(errors.MISSING_CASE, missingKeys);
  }
}

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
function Option(isSome, value) {
  this._ = isSome;
  this._value = value;
}

Option.prototype = {

  /**
   * Program control flow
   *
   * @example
   * // with es6 arrow functions:
   * var answer = Some(42).match({
   *   Some: (v) => v,
   *   None: () => 0,
   * });
   * assert(answer === 42);
   *
   * // regular functions are just slightly more verbose
   * var answer = None().match({
   *   Some: function(v) { return v; },
   *   None: function() { return 0; },
   * });
   * assert(answer === 0);
   * @param {Object} cases
   * @param {valueCb} cases.Some - function to call if the Option is a Some
   * @param {valueCb} cases.None - function to call if the Option is a None
   * @returns {value} the result of calling the callback for either Some or None
   */
  match: function match(cases) {
    mustHave(["Some", "None"], cases);
    return this._ ? cases.Some(this._value) : cases.None();
  },

  /**
   * @example
   * assert(Some(42).isSome() === true);
   * assert(None().isSome() === false);
   * @returns {boolean}
   */
  isSome: function isSome() {
    return this._;
  },

  /**
   * @example
   * assert(Some(42).isNone() === false);
   * assert(None().isNone() === true);
   * @returns {boolean}
   */
  isNone: function isNone() {
    return !this._;
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
  expect: function expect(err) {
    if (this._) {
      return this._value;
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
   * @throws UNWRAP_NONE
   * @returns {value}
   */
  unwrap: function unwrap() {
    if (this._) {
      return this._value;
    } else {
      throw error(errors.UNWRAP_NONE, "Tried to unwrap None");
    }
  },

  /**
   * @param {value} def - A default value to return if the Option is None
   * @returns {value}
   */
  unwrapOr: function unwrapOr(def) {
    return this._ ? this._value : def;
  },

  /**
   * @param {valueCb} fn - A function to call to obtain a value to return if the Option is None
   * @returns {value}
   */
  unwrapOrElse: function unwrapOrElse(fn) {
    return this._ ? this._value : fn();
  },

  /**
   * @param {OptionCb} fn - A function to call on the value wrapped by Some
   * @returns {Option}
   */
  map: function map(fn) {
    return this._ ? Some(fn(this._value)) : this;
  },

  /**
   * @param {value} def - A default value to return for None
   * @param {valueCb} fn - A function to apply to a Some's value
   * @returns {value}
   */
  mapOr: function mapOr(def, fn) {
    return this._ ? fn(this._value) : def;
  },

  /**
   * @param {valueCb} defFn
   * @param {valueCb} fn
   * @returns {value}
   */
  mapOrElse: function mapOrElse(defFn, fn) {
    return this._ ? fn(this._value) : defFn();
  },

  /**
   * @param {err} err
   * @returns {Result}
   */
  okOr: function okOr(err) {
    return this._ ? Ok(this._value) : Err(err);
  },

  /**
   * @param {errCb} errFn
   * @returns {Result}
   */
  okOrElse: function okOrElse(errFn) {
    return this._ ? Ok(this._value) : Err(errFn());
  },

  /**
   * @returns {Array<value>}
   */
  array: function array() {
    return this._ ? [this._value] : []; // .iter; .into_item
  },

  /**
   * @param {Option} other
   * @returns {Option}
   */
  and: function and(other) {
    return this._ ? other : this;
  },

  /**
   * @param {OptionCb} fn
   * @returns {Option}
   */
  andThen: function andThen(fn) {
    return this._ ? fn(this._value) : this;
  },

  /**
   * @param {Option} other
   * @rturns {Option}
   */
  or: function or(other) {
    return this._ ? this : other;
  },

  /**
   * @param {OptionCb} fn
   * @returns {Option}
   */
  orElse: function orElse(fn) {
    return this._ ? this : fn();
  },

  /**
   * @returns {Option}
   */
  take: function take() {
    if (this._) {
      var taken = Some(this._value);
      this._ = false;
      this._value = null;
      return taken;
    } else {
      return None();
    }
  } };

function Result(isOk, value) {
  this._ = isOk;
  this._value = value;
}

Result.prototype = {
  match: function match(cases) {
    mustHave(["Ok", "Err"], cases);
    return cases[this._ ? "Ok" : "Err"](this._value);
  },
  isOk: function isOk() {
    return this._;
  },
  isErr: function isErr() {
    return !this._;
  },
  ok: function ok() {
    return this._ ? Some(this._value) : None();
  },
  err: function err() {
    return this._ ? None() : Some(this._value);
  },
  map: function map(fn) {
    return this._ ? Ok(fn(this._value)) : this;
  },
  mapErr: function mapErr(fn) {
    return this._ ? this : Err(fn(this._value));
  },
  array: function array() {
    return this._ ? [this._value] : []; // .iter; .into_item
  },
  and: function and(other) {
    return this._ ? other : this;
  },
  andThen: function andThen(fn) {
    return this._ ? fn(this._value) : this;
  },
  or: function or(other) {
    return this._ ? this : other;
  },
  orElse: function orElse(fn) {
    return this._ ? this : fn(this._value);
  },
  unwrapOr: function unwrapOr(def) {
    return this._ ? this._value : def;
  },
  unwrapOrElse: function unwrapOrElse(fn) {
    return this._ ? this._value : fn(this._value);
  },
  unwrap: function unwrap() {
    if (this._) {
      return this._value;
    } else {
      throw error(errors.UNWRAP_ERR, this._value);
    }
  },
  unwrapErr: function unwrapErr() {
    if (this._) {
      throw error(errors.UNWRAPERR_OK, this._value);
    } else {
      return this._value;
    }
  } };

/**
 * @example
 * var opt = Some(42);
 * @returns {Option}
 */
var Some = Option.Some = function Some(value) {
  return new Option(true, value);
};

var None = Option.None = function None() {
  return new Option(false, null);
};

var Ok = Result.Ok = function Ok(value) {
  return new Result(true, value);
};

var Err = Result.Err = function Err(errVal) {
  return new Result(false, errVal);
};

module.exports = {
  Option: Option,
  Some: Some,
  None: None,
  Result: Result,
  Ok: Ok,
  Err: Err,
  errors: errors };