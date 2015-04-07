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


function Enum<T>(options: T | string[], proto={}): T {
  if (!options) { throw EnumErr.MissingOptions(); }
  var arrOptions: string[];
  if (!(options instanceof Array)) {
    if (options instanceof Object) {
      arrOptions = Object.keys(options);
    } else {
      throw EnumErr.BadOptionType();
    }
  } else {
    arrOptions = <string[]>options;  // sketchhhhhhhh
  }
  function EnumOption(options, option, args) {
    this.options = arrOptions;
    this.option = option;
    this.args = args;
  }
  function mkEnumOption(options, option) {
    var args = [];
    for (var i=2, l=arguments.length; i<l; i++) {
      args.push(arguments[i]);
    }
    return new EnumOption(options, option, args);
  }
  EnumOption.prototype = assign({match}, proto);
  return <T>arrOptions.reduce((obj, opt) => {
    obj[opt] = mkEnumOption.bind(null, options, opt);
    return obj;
  }, {});
}


var $: (...args) => any;
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
  isSome() {
    return this.option === 'Some';
  },
  isNone() {
    return this.option === 'None';
  },
  expect(err) {
    if (this.option === 'Some') {
      return this.args[0];
    } else {
      throw err;
    }
  },
  unwrap() {
    if (this.option === 'Some') {
      return this.args[0];
    } else {
      throw MaybeError.UnwrapNone('Tried to unwrap None');
    }
  },
  unwrapOr(def) {
    return (this.option === 'Some') ? this.args[0] : def;
  },
  unwrapOrElse(fn) {
    return (this.option === 'Some') ? this.args[0] : fn();
  },
  map(fn) {
    return (this.option === 'Some') ? Maybe.Some(fn(this.args[0])) : this;
  },
  mapOr(def, fn) {
    return (this.option === 'Some') ? fn(this.args[0]) : def;
  },
  mapOrElse(defFn, fn) {
    return (this.option === 'Some') ? fn(this.args[0]) : defFn();
  },
  okOr(err): Result {
    return (this.option === 'Some') ? Result.Ok(this.args[0]) : Result.Err(err);
  },
  okOrElse(errFn) {
    return (this.option === 'Some') ? Result.Ok(this.args[0]) : Result.Err(errFn());
  },
  array() {
    return (this.option === 'Some') ? [this.args[0]] : [];  // .iter; .into_item
  },
  and(other) {
    return (this.option === 'Some') ? other : this;
  },
  andThen(fn) {
    return (this.option === 'Some') ? fn(this.args[0]) : this;
  },
  or(other) {
    return (this.option === 'Some') ? this : other;
  },
  orElse(fn) {
    return (this.option === 'Some') ? this : fn();
  },
  take() {
    if (this.option === 'Some') {
      var taken = Maybe.Some(this.args[0]);
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
}, maybeProto);


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
  isOk() {
    return this.option === 'Ok';
  },
  isErr() {
    return this.option === 'Err';
  },
  ok() {
    return (this.option === 'Ok') ? Maybe.Some(this.args[0]) : Maybe.None();
  },
  err() {
    return (this.option === 'Ok') ? Maybe.None() : Maybe.Some(this.args[0]);
  },
  map(fn) {
    return (this.option === 'Ok') ? Result.Ok(fn(this.args[0])) : this;
  },
  mapErr(fn) {
    return (this.option === 'Ok') ? this : Result.Err(fn(this.args[0]));
  },
  array() {
    return (this.option === 'Ok') ? [this.args[0]] : [];  // .iter; .into_item
  },
  and(other) {
    return (this.option === 'Ok') ? other : this;
  },
  andThen(fn) {
    return (this.option === 'Ok') ? fn(this.args[0]) : this;
  },
  or(other) {
    return (this.option === 'Ok') ? this : other;
  },
  orElse(fn) {
    return (this.option === 'Ok') ? this : fn(this.args[0]);
  },
  unwrapOr(def) {
    return (this.option === 'Ok') ? this.args[0] : def;
  },
  unwrapOrElse(fn) {
    return (this.option === 'Ok') ? this.args[0] : fn(this.args[0]);
  },
  unwrap() {
    if (this.option === 'Ok') {
      return this.args[0];
    } else {
      throw ResultError.UnwrapErr(this.args[0]);
    }
  },
  unwrapErr() {
    if (this.option === 'Ok') {
      throw ResultError.UnwrapErrAsOk(this.args[0]);
    } else {
      return this.args[0];
    }
  },
};

var Result = Enum({
  Ok:  $,
  Err: $,
}, resultProto);


module.exports = {
  Enum,

  Maybe,
  Some: Maybe.Some,
  None: Maybe.None,

  Result,
  Ok: Result.Ok,
  Err: Result.Err,
};
