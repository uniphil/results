/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */

declare var require;
declare var assign;
declare var module;


var assign = require('object-assign');

function covers(options, paths) {
  return paths.hasOwnProperty('_') ? true :
    options.every((opt) => paths.hasOwnProperty(opt)) &&
    options.length === Object.keys(paths).length;
}

function match(paths) {
  if (!covers(this.options, paths)) { throw EnumErr.NonExhaustiveMatch(); }
  return paths.hasOwnProperty(this.option) ?
    paths[this.option].apply(null, this.args) :
    paths['_'](this);
};

function Enum(options, proto={}) {
  if (!options) { throw EnumErr.MissingOptions(); }
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
    for (var i=2, l=arguments.length; i<l; i++) {
      args.push(arguments[i]);
    }
    return new EnumOption(options, option, args);
  }
  EnumOption.prototype = assign({match}, proto);
  return options.reduce((obj, opt) => {
    obj[opt] = mkEnumOption.bind(null, options, opt);
    return obj;
  }, {});
}

var EnumErr = Enum({
  MissingOptions:     null,
  BadOptionType:      null,
  NonExhaustiveMatch: null,
});


var MaybeError = Enum({
  UnwrapNone: null,
});


var Maybe = Enum(['Some', 'None'], {
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
  okOr(err) {
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
});


module.exports = {
  Enum,

  Maybe: Maybe,
  Some: Maybe.Some,
  None: Maybe.None,

  Result,
  Ok: Result.Ok,
  Err: Result.Err,
};
