/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */


/**
 * @throws Error if the match is not exhaustive, or if there are weird keys
 */
function match(to) {
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


function unionOptionToString() {
  return `[UnionOption ${this.name}(${this.data.join(', ')}) ` +
    `from Union { ${Object.keys(this.options).join(', ')} }]`;
}


function _factory(options, name, UnionOptionClass) {
  return function(...data) {
    return new UnionOptionClass(options, name, data);
  };
}


function Union(options, proto={}, static_={}, factory=_factory) {
  if (options.hasOwnProperty('toString')) {
    throw new Error('Union: cannot use reserved name `toString` as part of a Union');
  }
  if (options.hasOwnProperty('OptionClass')) {
    throw new Error('Union: cannot use reserved name `UnionClass` as part of a Union');
  }
  for (let k of Object.keys(static_)) {
    if (options.hasOwnProperty(k)) {
      throw new Error(`Union: cannot add static method '${k}' to Union which ` +
        `has the same name as a member (members: ${options.join(', ')}).`);
    }
  }
  function UnionOption(options, name, data) {
    this.options = options;
    this.name = name;
    this.data = data;
  }
  UnionOption.prototype = {
    match: match,
    toString: unionOptionToString,
    ...proto
  };
  const union = {
    OptionClass: UnionOption,
    toString: () => `[Union { ${Object.keys(options).join(', ')} }]`,
    ...static_
  };
  for (let name of Object.keys(options)) {
    union[name] = factory(options, name, UnionOption);
  }
  return union;
}


const maybeProto = {
  _promote(value) {
    if (value instanceof Maybe.OptionClass) {
      return value;
    } else {
      return Maybe.Some(value);
    }
  },
  /**
   * @throws Error if the match is not exhaustive
   */
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
  /**
   * @throws whatever is passed as the arg
   */
  expect(err) {
    if (this.name === 'Some') {
      return this.data;
    } else {
      throw err;
    }
  },
  /**
   * @throws Error if it is None
   */
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
  promiseOr(err) {
    return (this.name === 'Some') ? Promise.resolve(this.data) : Promise.reject(err);
  },
  promiseOrElse(fn) {
    return (this.name === 'Some') ? Promise.resolve(this.data) : Promise.reject(fn());
  },
  and(other) {
    return (this.name === 'Some') ? this._promote(other) : this;
  },
  andThen(fn) {
    return (this.name === 'Some') ? this._promote(fn(this.data)) : this;
  },
  or(other) {
    return (this.name === 'Some') ? this : this._promote(other);
  },
  orElse(fn) {
    return (this.name === 'Some') ? this : this._promote(fn());
  },
};


const maybeStatic = {
  all: (values) => values.reduce((res, next) =>
    res.andThen(resArr => maybeProto._promote(next)
      .andThen(v => Maybe.Some(resArr.concat(v))))
  , Maybe.Some([])),
};


const Maybe = Union({
  Some: null,
  None: null,
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


const resultProto = {
  _promote(value) {
    if (value instanceof Result.OptionClass) {
      return value;
    } else {
      return Result.Ok(value);
    }
  },
  /**
   * @throws Error if the match is not exhaustive
   */
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
  promise() {
    return (this.name === 'Ok') ? Promise.resolve(this.data) : Promise.reject(this.data);
  },
  promiseErr() {
    return (this.name === 'Ok') ? Promise.reject(this.data) : Promise.resolve(this.data);
  },
  and(other) {
    return (this.name === 'Ok') ? this._promote(other) : this;
  },
  andThen(fn) {
    return (this.name === 'Ok') ? this._promote(fn(this.data)) : this;
  },
  or(other) {
    return (this.name === 'Ok') ? this : this._promote(other);
  },
  orElse(fn) {
    return (this.name === 'Ok') ? this : this._promote(fn(this.data));
  },
  unwrapOr(def) {
    return (this.name === 'Ok') ? this.data : def;
  },
  unwrapOrElse(fn) {
    return (this.name === 'Ok') ? this.data : fn(this.data);
  },
  /**
   * @throws the value from Err(value)
   */
  unwrap() {
    if (this.name === 'Ok') {
      return this.data;
    } else {
      throw new Error('Result Union: Tried to .unwrap() Err as Ok');
    }
  },
  /**
   * @throws the value from Ok(value)
   */
  unwrapErr() {
    if (this.name === 'Ok') {
      throw new Error('Result Union: Tried to .unwrap() Ok as Err');
    } else {
      return this.data;
    }
  },
};


const resultStatic = {
  all: (values) => values.reduce((res, next) =>
    res.andThen(resArr => resultProto._promote(next)
      .andThen(v => Result.Ok(resArr.concat(v))))
  , Result.Ok([])),
};

const Result = Union({
  Ok: null,
  Err: null,
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
