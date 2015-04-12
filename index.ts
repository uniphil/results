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


/**
 * @throws EnumError.NonExhaustiveMatch
 */
function match(to) {
  if (typeof to._ === 'function') {
    if (typeof to[this.name] === 'function') {
      return to[this.name].apply(null, this.args);
    } else {
      return to._(this);
    }
  } else {
    for (var i=0; i<this.options.length; i++) {
      if (typeof to[this.options[i]] !== 'function') {
        throw EnumErr.NonExhaustiveMatch();
      }
    }
    return to[this.name].apply(null, this.args);
  }
};



interface EnumOption {
  match: (paths: Object) => any;
}


function _factory(options: string[], name: string, EnumOptionClass) {
  return function() {
    var args = [];
    for (var i=0; i<arguments.length; i++) {
      args[i] = arguments[i];
    }
    return new EnumOptionClass(options, name, args);
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
  function EnumOption(options: string[], name: string, args) {
    this.options = options;
    this.name = name;
    this.args = args;
  }
  EnumOption.prototype = assign({match}, proto);
  return <T>arrOptions.reduce((obj, name) => {
    obj[name] = factory(arrOptions, name, EnumOption);
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
    return this.name === 'Some';
  },
  isNone() {
    return this.name === 'None';
  },
  expect(err) {
    if (this.name === 'Some') {
      return this.args;
    } else {
      throw err;
    }
  },
  unwrap() {
    if (this.name === 'Some') {
      return this.args;
    } else {
      throw MaybeError.UnwrapNone('Tried to unwrap None');
    }
  },
  unwrapOr(def) {
    return (this.name === 'Some') ? this.args : def;
  },
  unwrapOrElse(fn) {
    return (this.name === 'Some') ? this.args : fn();
  },
  map(fn) {
    return (this.name === 'Some') ? Maybe.Some(fn(this.args)) : this;
  },
  mapOr(def, fn) {
    return (this.name === 'Some') ? fn(this.args) : def;
  },
  mapOrElse(defFn, fn) {
    return (this.name === 'Some') ? fn(this.args) : defFn();
  },
  okOr(err): Result {
    return (this.name === 'Some') ? Result.Ok(this.args) : Result.Err(err);
  },
  okOrElse(errFn) {
    return (this.name === 'Some') ? Result.Ok(this.args) : Result.Err(errFn());
  },
  array() {
    return (this.name === 'Some') ? [this.args] : [];  // .iter; .into_item
  },
  and(other) {
    return (this.name === 'Some') ? other : this;
  },
  andThen(fn) {
    return (this.name === 'Some') ? fn(this.args) : this;
  },
  or(other) {
    return (this.name === 'Some') ? this : other;
  },
  orElse(fn) {
    return (this.name === 'Some') ? this : fn();
  },
  take() {
    if (this.name === 'Some') {
      var taken = Maybe.Some(this.args);
      this.args[0] = undefined;
      this.name = 'None';
      return taken;
    } else {
      return Maybe.None();
    }
  },
};

var Maybe = Enum({
  Some: $,
  None: $,
}, maybeProto, (options, name, EnumOptionClass) =>
  name === 'Some' ?
    (value) => new EnumOptionClass(options, name, value) :
    () => new EnumOptionClass(options, name, null));


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
    return this.name === 'Ok';
  },
  isErr() {
    return this.name === 'Err';
  },
  ok() {
    return (this.name === 'Ok') ? Maybe.Some(this.args) : Maybe.None();
  },
  err() {
    return (this.name === 'Ok') ? Maybe.None() : Maybe.Some(this.args);
  },
  map(fn) {
    return (this.name === 'Ok') ? Result.Ok(fn(this.args)) : this;
  },
  mapErr(fn) {
    return (this.name === 'Ok') ? this : Result.Err(fn(this.args));
  },
  array() {
    return (this.name === 'Ok') ? [this.args] : [];  // .iter; .into_item
  },
  and(other) {
    return (this.name === 'Ok') ? other : this;
  },
  andThen(fn) {
    return (this.name === 'Ok') ? fn(this.args) : this;
  },
  or(other) {
    return (this.name === 'Ok') ? this : other;
  },
  orElse(fn) {
    return (this.name === 'Ok') ? this : fn(this.args);
  },
  unwrapOr(def) {
    return (this.name === 'Ok') ? this.args : def;
  },
  unwrapOrElse(fn) {
    return (this.name === 'Ok') ? this.args : fn(this.args);
  },
  unwrap() {
    if (this.name === 'Ok') {
      return this.args;
    } else {
      throw ResultError.UnwrapErr(this.args);
    }
  },
  unwrapErr() {
    if (this.name === 'Ok') {
      throw ResultError.UnwrapErrAsOk(this.args);
    } else {
      return this.args;
    }
  },
};

var Result = Enum({
  Ok:  $,
  Err: $,
}, resultProto, (options, name, EnumOptionClass) =>
  (value) => new EnumOptionClass(options, name, value));


module.exports = {
  Enum,

  Maybe,
  Some: Maybe.Some,
  None: Maybe.None,

  Result,
  Ok: Result.Ok,
  Err: Result.Err,
};
