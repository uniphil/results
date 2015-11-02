/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */

 const _ = Symbol('Union match catch-all symbol');

/**
 * Custom error type from http://stackoverflow.com/a/17891099/1299695
 * @param {string} message An associated message to explain the error
 * @returns {Error} An instance of UnionError, which subclasses Error
 */
function UnionError(message) {
  const realErr = Error.call(this, message);
  this.name = realErr.name = 'UnionError';
  this.stack = realErr.stack;
  this.message = message;
}
UnionError.protoype = Object.create(Error.prototype, { constructor: {
  value: UnionError,
  writeable: true,
  configurable: true,
}});


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
    throw new UnionError(`match called on a non-member option: '${option}'`);
  }
  for (let k of Object.keys(paths)) {
    if (!option.options.hasOwnProperty(k) && k !== '_' && k !== _) {  // DEPRECATED symbol _
      throw new UnionError(`unrecognized match option: '${k}'`);
    }
  }
  // DEPRECATED: symbol [_] catch-all will be removed after 0.10
  if (typeof paths._ === 'function' || typeof paths[_] === 'function') {  // match is de-facto exhaustive w/ `_`
    if (typeof paths[option.name] === 'function') {
      return paths[option.name](...option.data);
    } else {
      return (paths._ || paths[_])(option);  // DEPRECATED symbol [_]
    }
  } else {
    // ensure match is exhaustive
    for (let k in option.options) {
      if (typeof paths[k] !== 'function') {
        if (typeof paths[k] === 'undefined') {
          throw new UnionError(`Non-exhaustive match is missing '${k}'`);
        } else {
          throw new UnionError(`match expected a function for '${k}', but found a '${typeof paths[k]}'`);
        }
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
  if (typeof options !== 'object') {
    throw new UnionError('Param `options` must be an object with keys for each member of the union');
  }
  if (options.hasOwnProperty('toString')) {
    throw new UnionError('Cannot use reserved name `toString` as part of a Union');
  }
  if (options.hasOwnProperty('match')) {
    throw new UnionError('Cannot use reserved name `match` as part of a Union');
  }
  if (options.hasOwnProperty('OptionClass')) {
    throw new UnionError('Cannot use reserved name `UnionClass` as part of a Union');
  }
  for (let k of Object.keys(static_)) {
    if (options.hasOwnProperty(k)) {
      throw new UnionError(`Cannot add static method '${k}' to Union which ` +
        `has the same name as a member (members: ${options.join(', ')}).`);
    }
  }
  if (options.hasOwnProperty('_')) {  // DEPRECATED
    console.warn('DEPRECATION WARNING: The union member name "_" will be reserved and throw an error in the next version of Results.');
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
      throw new UnionError('Tried to .unwrap() Maybe.None as Some');
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
    return (this.name === 'Some') ? Maybe.Some(other) : this;
  },
  andThen(fn) {
    return (this.name === 'Some') ? Maybe.Some(fn(this.data)) : this;
  },
  or(other) {
    return (this.name === 'Some') ? this : Maybe.Some(other);
  },
  orElse(fn) {
    return (this.name === 'Some') ? this : Maybe.Some(fn());
  },
};


const maybeStatic = {
  match(option, paths) {
    const normalOption = new this.OptionClass(option.options, option.name, [option.data]);
    return match.call(this, normalOption, paths);
  },
  all: (values) => values.reduce((res, next) =>
    res.andThen(resArr => Maybe.Some(next)
      .andThen(v => resArr.concat(v)))
  , Maybe.Some([])),
  undefined: val => (typeof val === 'undefined') ? Maybe.None() : Maybe.Some(val),
  null: val => val === null ? Maybe.None() : Maybe.Some(val),
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
    return (this.name === 'Ok') ? Result.Ok(other) : this;
  },
  andThen(fn) {
    return (this.name === 'Ok') ? Result.Ok(fn(this.data)) : this;
  },
  or(other) {
    return (this.name === 'Ok') ? this : Result.Ok(other);
  },
  orElse(fn) {
    return (this.name === 'Ok') ? this : Result.Ok(fn(this.data));
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
      throw new UnionError('tried to .unwrap() Result.Err as Ok');
    }
  },
  /**
   * @throws the value from Ok(value)
   */
  unwrapErr() {
    if (this.name === 'Ok') {
      throw new UnionError('Tried to .unwrap() Result.Ok as Err');
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
    res.andThen(resArr => Result.Ok(next)
      .andThen(v => resArr.concat(v)))
  , Result.Ok([])),
  try(maybeThrows) {
    try {
      return Result.Ok(maybeThrows());
    } catch (err) {
      return Result.Err(err);
    }
  },
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
  UnionError,
  _,  // DEPRECATED

  Maybe,
  Some: Maybe.Some,
  None: Maybe.None,

  Result,
  Ok: Result.Ok,
  Err: Result.Err,
};
