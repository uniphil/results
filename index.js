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

function covers( /*Array:*/options, /*Object:*/paths) {
  return paths.hasOwnProperty("_") ? true : options.every(function (opt) {
    return paths.hasOwnProperty(opt);
  }) && options.length === Object.keys(paths).length;
}

function match(paths) {
  if (!covers(this.options, paths)) {
    throw EnumErr.NonExhaustiveMatch();
  }
  return paths.hasOwnProperty(this.option) ? paths[this.option].apply(null, this.args) : paths._(this);
};

function Enum(options, proto) {
  if (!options) {
    throw EnumErr.MissingOptions();
  }
  if (!(options instanceof Array)) {
    if (options instanceof Object) {
      options = Object.keys(options);
    } else {
      throw EnumErr.BadOptionType();
    }
  }
  function EnumOption(options, option, args) {
    this.options = options;
    this.option = option;
    this.args = args;
  }
  function mkEnumOption(options, option) {
    var args = [];
    for (var i = 2, l = arguments.length; i < l; i++) {
      args.push(arguments[i]);
    }
    return new EnumOption(options, option, args);
  }
  EnumOption.prototype = assign({ match: match }, proto);
  return options.reduce(function (obj, opt) {
    obj[opt] = mkEnumOption.bind(null, options, opt);
    return obj;
  }, {});
}

var EnumErr = Enum({
  MissingOptions: null,
  BadOptionType: null,
  NonExhaustiveMatch: null });

var OptionError = Enum({
  UnwrapNone: null });

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
var Option = Enum(["Some", "None"], {

  /**
   * @example
   * assert(Some(42).isSome() === true);
   * assert(None().isSome() === false);
   * @returns {boolean}
   */
  isSome: function isSome() {
    return this.option === "Some";
  },

  /**
   * @example
   * assert(Some(42).isNone() === false);
   * assert(None().isNone() === true);
   * @returns {boolean}
   */
  isNone: function isNone() {
    return this.option === "None";
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
    if (this.option === "Some") {
      return this.args[0];
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
  unwrap: function unwrap() {
    if (this.option === "Some") {
      return this.args[0];
    } else {
      throw OptionError.UnwrapNone("Tried to unwrap None");
    }
  },

  /**
   * @param {value} def - A default value to return if the Option is None
   * @returns {value}
   */
  unwrapOr: function unwrapOr(def) {
    return this.option === "Some" ? this.args[0] : def;
  },

  /**
   * @param {valueCb} fn - A function to call to obtain a value to return if the Option is None
   * @returns {value}
   */
  unwrapOrElse: function unwrapOrElse(fn) {
    return this.option === "Some" ? this.args[0] : fn();
  },

  /**
   * @param {OptionCb} fn - A function to call on the value wrapped by Some
   * @returns {Option}
   */
  map: function map(fn) {
    return this.option === "Some" ? Option.Some(fn(this.args[0])) : this;
  },

  /**
   * @param {value} def - A default value to return for None
   * @param {valueCb} fn - A function to apply to a Some's value
   * @returns {value}
   */
  mapOr: function mapOr(def, fn) {
    return this.option === "Some" ? fn(this.args[0]) : def;
  },

  /**
   * @param {valueCb} defFn
   * @param {valueCb} fn
   * @returns {value}
   */
  mapOrElse: function mapOrElse(defFn, fn) {
    return this.option === "Some" ? fn(this.args[0]) : defFn();
  },

  /**
   * @param {err} err
   * @returns {Result}
   */
  okOr: function okOr(err) {
    return this.option === "Some" ? Result.Ok(this.args[0]) : Result.Err(err);
  },

  /**
   * @param {errCb} errFn
   * @returns {Result}
   */
  okOrElse: function okOrElse(errFn) {
    return this.option === "Some" ? Result.Ok(this.args[0]) : Result.Err(errFn());
  },

  /**
   * @returns {Array<value>}
   */
  array: function array() {
    return this.option === "Some" ? [this.args[0]] : []; // .iter; .into_item
  },

  /**
   * @param {Option} other
   * @returns {Option}
   */
  and: function and(other) {
    return this.option === "Some" ? other : this;
  },

  /**
   * @param {OptionCb} fn
   * @returns {Option}
   */
  andThen: function andThen(fn) {
    return this.option === "Some" ? fn(this.args[0]) : this;
  },

  /**
   * @param {Option} other
   * @rturns {Option}
   */
  or: function or(other) {
    return this.option === "Some" ? this : other;
  },

  /**
   * @param {OptionCb} fn
   * @returns {Option}
   */
  orElse: function orElse(fn) {
    return this.option === "Some" ? this : fn();
  },

  /**
   * @returns {Option}
   */
  take: function take() {
    if (this.option === "Some") {
      var taken = Option.Some(this.args[0]);
      this.args[0] = undefined;
      this.option = "None";
      return taken;
    } else {
      return Option.None();
    }
  } });

var ResultError = Enum({
  UnwrapErrAsOk: null,
  UnwrapErr: null });

var Result = Enum(["Ok", "Err"], {
  isOk: function isOk() {
    return this.option === "Ok";
  },
  isErr: function isErr() {
    return this.option === "Err";
  },
  ok: function ok() {
    return this.option === "Ok" ? Option.Some(this.args[0]) : Option.None();
  },
  err: function err() {
    return this.option === "Ok" ? Option.None() : Option.Some(this.args[0]);
  },
  map: function map(fn) {
    return this.option === "Ok" ? Result.Ok(fn(this.args[0])) : this;
  },
  mapErr: function mapErr(fn) {
    return this.option === "Ok" ? this : Result.Err(fn(this.args[0]));
  },
  array: function array() {
    return this.option === "Ok" ? [this.args[0]] : []; // .iter; .into_item
  },
  and: function and(other) {
    return this.option === "Ok" ? other : this;
  },
  andThen: function andThen(fn) {
    return this.option === "Ok" ? fn(this.args[0]) : this;
  },
  or: function or(other) {
    return this.option === "Ok" ? this : other;
  },
  orElse: function orElse(fn) {
    return this.option === "Ok" ? this : fn(this.args[0]);
  },
  unwrapOr: function unwrapOr(def) {
    return this.option === "Ok" ? this.args[0] : def;
  },
  unwrapOrElse: function unwrapOrElse(fn) {
    return this.option === "Ok" ? this.args[0] : fn(this.args[0]);
  },
  unwrap: function unwrap() {
    if (this.option === "Ok") {
      return this.args[0];
    } else {
      throw ResultError.UnwrapErr(this.args[0]);
    }
  },
  unwrapErr: function unwrapErr() {
    if (this.option === "Ok") {
      throw ResultError.UnwrapErrAsOk(this.args[0]);
    } else {
      return this.args[0];
    }
  } });

module.exports = {
  Enum: Enum,

  Option: Option,
  Some: Option.Some,
  None: Option.None,

  Result: Result,
  Ok: Result.Ok,
  Err: Result.Err };