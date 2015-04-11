/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */

/// <reference path="./node.d.ts" />

/**
 * Object.assign ponyfill
 */
var assign: (...objs: Object[]) => Object = require('object-assign');


function covers(options: string[], paths: Object) {
  return paths.hasOwnProperty('_') ? true :
    options.every((opt) => paths.hasOwnProperty(opt)) &&
    options.length === Object.keys(paths).length;
}

/**
 * @throws EnumError.NonExhaustiveMatch
 */
function match(paths: Object) {
  if (!covers(this.options, paths)) { throw EnumErr.NonExhaustiveMatch(); }
  return paths.hasOwnProperty(this.option) ?
    paths[this.option].apply(null, this.args) :
    paths['_'](this);
};



interface EnumOption {
  match: (paths: Object) => any;
}


function _factory(options: string[], option: string, EnumOptionClass) {
  return function() {
    var args = [];
    for (var i=0; i<arguments.length; i++) {
      args[i] = arguments[i];
    }
    return new EnumOptionClass(options, option, args);
  };
}


function Enum<T>(options: T | string[], proto={}, factory:any=_factory): T {
  if (!options) { throw EnumErr.MissingOptions(); }
  var arrOptions: string[];
  if (!(options instanceof Array)) {
    if (options instanceof Object) {
      arrOptions = Object.keys(options);
    } else {
      throw EnumErr.BadOptionType();
    }
  } else {
    arrOptions = <string[]>options;
  }
  function EnumOption(options: string[], option: string, args) {
    this.options = options;
    this.option = option;
    this.args = args;
  }
  EnumOption.prototype = assign({match}, proto);
  return <T>arrOptions.reduce((obj, option) => {
    obj[option] = factory(arrOptions, option, EnumOption);
    return obj;
  }, {});
}


var $;
var EnumErr = Enum({
  MissingOptions:     $,
  BadOptionType:      $,
  NonExhaustiveMatch: $,
});


var MaybeError = Enum({
  UnwrapNone: $,
});


interface Maybe {
  Some: (someValue) => EnumOption;
  None: () => EnumOption;
}

interface MaybeOption {
  isSome: () => boolean;
  isNone: () => boolean;
  /**
   * @throws whatever is passed as the arg
   */
  expect: (err) => any;
  /**
   * @throws MaybeError.UnwrapNone
   */
  unwrap: () => any;
  unwrapOr: (def) => any;
  unwrapOrElse: (fn: () => any) => any;
  map: (fn: (someValue) => any) => Maybe;
  mapOr: (def, fn: (someValue) => any) => any;
  mapOrElse: (defFn: () => any, fn: (someValue) => any) => any;
  okOr: (err) => Result;
  okOrElse: (errFn: () => any) => Result;
  array: () => Array<any>;
  and: (other: Maybe) => Maybe;
  andThen: (fn: (someValue) => Maybe) => Maybe;
  or: (other: Maybe) => Maybe;
  orElse: (fn: () => Maybe) => Maybe;
  take: () => Maybe;
}

var maybeProto: MaybeOption = {
  match(paths) {
    return match.call(assign({}, this, {args: [this.args]}), paths);
  },
  isSome() {
    return this.option === 'Some';
  },
  isNone() {
    return this.option === 'None';
  },
  expect(err) {
    if (this.option === 'Some') {
      return this.args;
    } else {
      throw err;
    }
  },
  unwrap() {
    if (this.option === 'Some') {
      return this.args;
    } else {
      throw MaybeError.UnwrapNone('Tried to unwrap None');
    }
  },
  unwrapOr(def) {
    return (this.option === 'Some') ? this.args : def;
  },
  unwrapOrElse(fn) {
    return (this.option === 'Some') ? this.args : fn();
  },
  map(fn) {
    return (this.option === 'Some') ? Maybe.Some(fn(this.args)) : this;
  },
  mapOr(def, fn) {
    return (this.option === 'Some') ? fn(this.args) : def;
  },
  mapOrElse(defFn, fn) {
    return (this.option === 'Some') ? fn(this.args) : defFn();
  },
  okOr(err): Result {
    return (this.option === 'Some') ? Result.Ok(this.args) : Result.Err(err);
  },
  okOrElse(errFn) {
    return (this.option === 'Some') ? Result.Ok(this.args) : Result.Err(errFn());
  },
  array() {
    return (this.option === 'Some') ? [this.args] : [];  // .iter; .into_item
  },
  and(other) {
    return (this.option === 'Some') ? other : this;
  },
  andThen(fn) {
    return (this.option === 'Some') ? fn(this.args) : this;
  },
  or(other) {
    return (this.option === 'Some') ? this : other;
  },
  orElse(fn) {
    return (this.option === 'Some') ? this : fn();
  },
  take() {
    if (this.option === 'Some') {
      var taken = Maybe.Some(this.args);
      this.args[0] = undefined;
      this.option = 'None';
      return taken;
    } else {
      return Maybe.None();
    }
  },
};

var Maybe = Enum({
  Some: $,
  None: $,
}, maybeProto, (options, option, EnumOptionClass) =>
  option === 'Some' ?
    (value) => new EnumOptionClass(options, option, value) :
    () => new EnumOptionClass(options, option, null));


var ResultError = Enum({
  UnwrapErrAsOk: null,
  UnwrapErr: null,
});


interface Result {
  Ok: (okValue) => EnumOption;
  Err: (errValue) => EnumOption;
}

interface ResultOption {
  isOk: boolean;
  isErr: boolean;
  ok: Maybe;
  err: Maybe;
  map: (fn: (okValue) => any) => Result;
  mapErr: (fn: (errValue) => any) => Result;
  array: () => Array<any>;
  and: (other: Result) => Result;
  andThen: (fn: (okValue) => Result) => Result;
  or: (other: Result) => Result;
  orElse: (fn: (errValue) => Result) => Result;
  unwrapOr: (def: any) => any;
  unwrapOrElse: (fn: (errValue) => any) => any;
  /**
   * @throws the value from Err(value)
   */
  unwrap: () => any;
  /**
   * @throws the value from Ok(value)
   */
  unwrapErr: () => any;
}

var resultProto = {
  match(paths) {
    return match.call(assign({}, this, {args: [this.args]}), paths);
  },
  isOk() {
    return this.option === 'Ok';
  },
  isErr() {
    return this.option === 'Err';
  },
  ok() {
    return (this.option === 'Ok') ? Maybe.Some(this.args) : Maybe.None();
  },
  err() {
    return (this.option === 'Ok') ? Maybe.None() : Maybe.Some(this.args);
  },
  map(fn) {
    return (this.option === 'Ok') ? Result.Ok(fn(this.args)) : this;
  },
  mapErr(fn) {
    return (this.option === 'Ok') ? this : Result.Err(fn(this.args));
  },
  array() {
    return (this.option === 'Ok') ? [this.args] : [];  // .iter; .into_item
  },
  and(other) {
    return (this.option === 'Ok') ? other : this;
  },
  andThen(fn) {
    return (this.option === 'Ok') ? fn(this.args) : this;
  },
  or(other) {
    return (this.option === 'Ok') ? this : other;
  },
  orElse(fn) {
    return (this.option === 'Ok') ? this : fn(this.args);
  },
  unwrapOr(def) {
    return (this.option === 'Ok') ? this.args : def;
  },
  unwrapOrElse(fn) {
    return (this.option === 'Ok') ? this.args : fn(this.args);
  },
  unwrap() {
    if (this.option === 'Ok') {
      return this.args;
    } else {
      throw ResultError.UnwrapErr(this.args);
    }
  },
  unwrapErr() {
    if (this.option === 'Ok') {
      throw ResultError.UnwrapErrAsOk(this.args);
    } else {
      return this.args;
    }
  },
};

var Result = Enum({
  Ok:  $,
  Err: $,
}, resultProto, (options, option, EnumOptionClass) =>
  (value) => new EnumOptionClass(options, option, value));


module.exports = {
  Enum,

  Maybe,
  Some: Maybe.Some,
  None: Maybe.None,

  Result,
  Ok: Result.Ok,
  Err: Result.Err,
};
