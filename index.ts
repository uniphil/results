/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */

/// <reference path="./node.d.ts" />


var $;  // just a  placeholder for RHS of objects whose keys we want


/**
 * @throws Error if the match is not exhaustive, or if there are weird keys
 */
function match(to: any): any {
  for (let k in to) {
    if (to.hasOwnProperty(k)) {
      if (!this.options.hasOwnProperty(k) && k !== '_') {
        throw new Error(`Union match: unrecognized match option: '${k}'`);
      }
    }
  }
  if (typeof to._ === 'function') {  // match is de-facto exhaustive w/ `_`
    if (typeof to[this.name] === 'function') {
      return to[this.name].apply(null, this.data);
    } else {
      return to._(this);
    }
  } else {
    // ensure match is exhaustive
    for (let k in this.options) {
      if (typeof to[k] !== 'function') {
        throw new Error(`Union match: Non-exhaustive match is missing '${k}'`);
      }
    }
    return to[this.name].apply(null, this.data);
  }
};



interface UnionOption {
  options: any;
  name: String;
  data: any[];
  match: (paths: Object) => any;
  new (options: any, name: String, data: Array<any>);
}


function _factory(options: Object, name: string, UnionOptionClass: UnionOption):
(...args: any[]) => UnionOption {
  return function() {
    var data = [];
    for (var i=0; i<arguments.length; i++) {
      data[i] = arguments[i];
    }
    return new UnionOptionClass(options, name, data);
  };
}


function Union<T>(options: T, proto:any={}, static:any={}, factory:any=_factory): T {
  function UnionOption(options: T, name: string, data: any[]) {
    this.options = options;
    this.name = name;
    this.data = data;
  }
  UnionOption.prototype = proto;
  if (typeof proto.match === 'undefined') {
    proto.match = match;
  }
  var union_ = Object.keys(options).reduce((obj, name) => {
    obj[name] = factory(options, name, UnionOption);
    return obj;
  }, {});
  for (var k in static) {
    if (static.hasOwnProperty(k)) {
      union_[k] = static[k];
    }
  }
  return <T>union_;
}


interface Maybe {
  Some: (someValue: any) => MaybeOption;
  None: () => MaybeOption;
  all: (values: MaybeOption[]) => MaybeOption;
}

interface MaybeOption {
  /**
   * @throws Error if the match is not exhaustive
   */
  match: (opts: Object) => any;
  isSome: () => Boolean;
  isNone: () => Boolean;
  /**
   * @throws whatever is passed as the arg
   */
  expect: (err) => any;
  /**
   * @throws Error if it is None
   */
  unwrap: () => any;
  unwrapOr: (def) => any;
  unwrapOrElse: (fn: () => any) => any;
  okOr: (err) => Result;
  okOrElse: (errFn: () => any) => Result;
  and: (other: Maybe) => Maybe;
  andThen: (fn: (someValue) => Maybe) => Maybe;
  or: (other: Maybe) => Maybe;
  orElse: (fn: () => Maybe) => Maybe;
}

var maybeProto: MaybeOption = {
  match(paths) {
    return match.call({
      options: this.options,
      name: this.name,
      data: [this.data]
    }, paths);
  },
  isSome() {
    return this.name === 'Some';
  },
  isNone() {
    return this.name === 'None';
  },
  expect(err) {
    if (this.name === 'Some') {
      return this.data;
    } else {
      throw err;
    }
  },
  unwrap() {
    if (this.name === 'Some') {
      return this.data;
    } else {
      throw new Error('Maybe Union: Tried to .unwrap() None as Some');
    }
  },
  unwrapOr(def) {
    return (this.name === 'Some') ? this.data : def;
  },
  unwrapOrElse(fn) {
    return (this.name === 'Some') ? this.data : fn();
  },
  okOr(err): Result {
    return (this.name === 'Some') ? Result.Ok(this.data) : Result.Err(err);
  },
  okOrElse(errFn) {
    return (this.name === 'Some') ? Result.Ok(this.data) : Result.Err(errFn());
  },
  and(other) {
    return (this.name === 'Some') ? other : this;
  },
  andThen(fn) {
    return (this.name === 'Some') ? fn(this.data) : this;
  },
  or(other) {
    return (this.name === 'Some') ? this : other;
  },
  orElse(fn) {
    return (this.name === 'Some') ? this : fn();
  },
};


interface MaybeStatic {
  all: (values: ResultOption[]) => ResultOption;
}

var maybeStatic: MaybeStatic = {
  all: (values) => values.reduce((res, next) =>
    res.andThen(resArr => next.andThen(v => Maybe.Some(resArr.concat(v))))
  , Maybe.Some([])),
};


var Maybe = Union({
  Some: $,
  None: $,
}, maybeProto, maybeStatic, (options, name, UnionOptionClass) => {
  if (name === 'Some') {
    return (value) => {
      if (value instanceof UnionOptionClass) {
        const unwrapped = value.unwrapOr();  // Some's value or Undefined
        return new UnionOptionClass(options, 'Some', unwrapped);
      } else {
        return new UnionOptionClass(options, 'Some', value);
      }
    };
  } else {  // None
    return () => new UnionOptionClass(options, 'None', null);
  }
});


var ResultError = Union({
  UnwrapErrAsOk: null,
  UnwrapErr: null,
});


interface Result {
  Ok: (okValue: any) => ResultOption;
  Err: (errValue: any) => ResultOption;
  all: (values: ResultOption[]) => ResultOption;
}

interface ResultOption {
  /**
   * @throws Error if the match is not exhaustive
   */
  match: (opts: Object) => any;
  isOk: () => Boolean;
  isErr: () => Boolean;
  ok: () => Maybe;
  err: () => Maybe;
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

var resultProto: ResultOption = {
  match(paths) {
    return match.call({
      options: this.options,
      name: this.name,
      data: [this.data]
    }, paths);
  },
  isOk() {
    return this.name === 'Ok';
  },
  isErr() {
    return this.name === 'Err';
  },
  ok() {
    return (this.name === 'Ok') ? Maybe.Some(this.data) : Maybe.None();
  },
  err() {
    return (this.name === 'Ok') ? Maybe.None() : Maybe.Some(this.data);
  },
  and(other) {
    return (this.name === 'Ok') ? other : this;
  },
  andThen(fn) {
    return (this.name === 'Ok') ? fn(this.data) : this;
  },
  or(other) {
    return (this.name === 'Ok') ? this : other;
  },
  orElse(fn) {
    return (this.name === 'Ok') ? this : fn(this.data);
  },
  unwrapOr(def) {
    return (this.name === 'Ok') ? this.data : def;
  },
  unwrapOrElse(fn) {
    return (this.name === 'Ok') ? this.data : fn(this.data);
  },
  unwrap() {
    if (this.name === 'Ok') {
      return this.data;
    } else {
      throw ResultError.UnwrapErr(this.data);
    }
  },
  unwrapErr() {
    if (this.name === 'Ok') {
      throw ResultError.UnwrapErrAsOk(this.data);
    } else {
      return this.data;
    }
  },
};

interface ResultStatic {
  all: (values: ResultOption[]) => ResultOption;
}

var resultStatic: ResultStatic = {
  all: (values) => values.reduce((res, next) =>
    res.andThen(resArr => next.andThen(v => Result.Ok(resArr.concat(v))))
  , Result.Ok([])),
};

var Result = Union({
  Ok:  $,
  Err: $,
}, resultProto, resultStatic, (options, name, UnionOptionClass) => {
  if (name === 'Ok') {
    return (value) => {
      if (value instanceof UnionOptionClass) {
        const unwrapped = value.unwrapOrElse(e => e);
        return new UnionOptionClass(options, 'Ok', unwrapped);
      } else {
        return new UnionOptionClass(options, 'Ok', value);
      }
    }
  } else {
    return (err) => new UnionOptionClass(options, 'Err', err);
  }
});


module.exports = {
  Union,

  Maybe,
  Some: Maybe.Some,
  None: Maybe.None,

  Result,
  Ok: Result.Ok,
  Err: Result.Err,
};
