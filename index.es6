/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */

 const _ = Symbol('Union match catch-all symbol');


/**
 * @throws Error when the match is not exhaustive
 * @throws Error when there are weird keys
 * @throws Error when `option` is the wrong type for this match
 * @param {EnumOption} option The instance to match against
 * @param {Object} paths The optionName: callback mapping
 * @returns {any} The result of calling the matching callback
 */
function match(option, paths) {
  if (!(option instanceof this.OptionClass)) {
    throw new Error(`Union match: called on a non-member option: '${option}'`);
  }
  for (let k of Object.keys(paths)) {
    if (!option.options.hasOwnProperty(k) && k !== _) {
      throw new Error(`Union match: unrecognized match option: '${k}'`);
    }
  }
  if (typeof paths[_] === 'function') {  // match is de-facto exhaustive w/ `_`
    if (typeof paths[option.name] === 'function') {
      return paths[option.name](...option.data);
    } else {
      return paths[_](option);
    }
  } else {
    // ensure match is exhaustive
    for (let k in option.options) {
      if (typeof paths[k] !== 'function') {
        throw new Error(`Union match: Non-exhaustive match is missing '${k}'`);
      }
    }
    return paths[option.name](...option.data);
  }
}


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
  if (options.hasOwnProperty('match')) {
    throw new Error('Union: cannot use reserved name `match` as part of a Union');
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
    toString: unionOptionToString,
    ...proto
  };
  const union = {
    OptionClass: UnionOption,
    toString: () => `[Union { ${Object.keys(options).join(', ')} }]`,
    match,
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
  match(option, paths) {
    const normalOption = new this.OptionClass(option.options, option.name, [option.data]);
    return match.call(this, normalOption, paths);
  },
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
        return value;
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
  match(option, paths) {
    const normalOption = new this.OptionClass(option.options, option.name, [option.data]);
    return match.call(this, normalOption, paths);
  },
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
        return value;
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
  _,

  Maybe,
  Some: Maybe.Some,
  None: Maybe.None,

  Result,
  Ok: Result.Ok,
  Err: Result.Err,
};
