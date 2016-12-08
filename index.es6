/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */


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
    if (process.env.NODE_ENV !== 'production' && process) {
      console.error(`Not a member from { ${Object.keys(paths).join(', ')} }:`, option);
    }
    throw new Error(`match called on a non-member option: '${String(option)}'. ` +
      `Expected a member from Union{ ${Object.keys(paths).join(', ')} }`);
  }
  for (let k of Object.keys(paths)) {
    if (!option.options.hasOwnProperty(k) && k !== '_') {
      throw new Error(`unrecognized match option: '${k}'`);
    }
  }
  if (typeof paths._ === 'function') {  // match is de-facto exhaustive w/ `_`
    if (typeof paths[option.name] === 'function') {
      return paths[option.name](option.payload);
    } else {
      return paths._(option.payload);
    }
  } else {
    // ensure match is exhaustive
    for (let k in option.options) {
      if (typeof paths[k] !== 'function') {
        if (typeof paths[k] === 'undefined') {
          throw new Error(`Non-exhaustive match is missing '${k}'`);
        } else {
          throw new Error(`match expected a function for '${k}', but found a '${typeof paths[k]}'`);
        }
      }
    }
    return paths[option.name](option.payload);
  }
}


// Useful in general, but specifically motivated by and inspired by immutablejs
// https://github.com/facebook/immutable-js/blob/master/src/is.js
function _equals(a, b) {
  if (a === b || (a !== a && b !== b)) {  // true for NaNs
    return true;
  }

  if (!a || !b) {
    return false;
  }

  // There is probably a cleaner way to do this check
  // Blame TDD :)
  if (a && typeof a.constructor === 'function' &&
      a.constructor.unionFactory === Union) {
    if (!(b && typeof b.constructor === 'function' &&
        b.constructor.unionFactory === Union)) {
      return false;
    }
    if (a.constructor !== b.constructor) {
      return false;
    }
    if (a.name !== b.name) {
      return false;
    }
    return _equals(a.payload, b.payload);
  }

  // I hate this block. Blame immutablejs :)
  if (typeof a.valueOf === 'function' &&
      typeof b.valueOf === 'function') {
    a = a.valueOf();
    b = b.valueOf();
    if (a === b || (a !== a && b !== b)) {
      return true;
    }
    if (!a || !b) {
      return false;
    }
  }
  if (typeof a.equals === 'function' &&
      typeof b.equals === 'function') {
    return a.equals(b);
  }
  return false;
}


function equalsProto(other) {
  return _equals(this, other);
}


function hashCode() {
  return 42;  // TODO: this is valid, but inefficient. Actually implement this :)
}


function unionOptionToString() {
  return `[${this.name}(${this.payload}) ` +
    `from Union{ ${Object.keys(this.options).join(', ')} }]`;
}


function _factory(options, name, UnionOptionClass) {
  return function(payload) {
    return new UnionOptionClass(options, name, payload);
  };
}


function Union(options, proto={}, static_={}, factory=_factory) {
  if (typeof options !== 'object') {
    throw new Error('Param `options` must be an object with keys for each member of the union');
  }
  if (options.hasOwnProperty('toString')) {
    throw new Error('Cannot use reserved name `toString` as part of a Union');
  }
  if (options.hasOwnProperty('match')) {
    throw new Error('Cannot use reserved name `match` as part of a Union');
  }
  if (options.hasOwnProperty('options')) {
    throw new UnionError('Cannot use reserved name `options` as part of a Union');
  }
  if (options.hasOwnProperty('OptionClass')) {
    throw new Error('Cannot use reserved name `UnionClass` as part of a Union');
  }
  for (let k of Object.keys(static_)) {
    if (options.hasOwnProperty(k)) {
      throw new Error(`Cannot add static method '${k}' to Union which ` +
        `has the same name as a member (members: ${options.join(', ')}).`);
    }
  }
  function UnionOption(options, name, payload) {
    this.options = options;
    this.name = name;
    this.payload = payload;
  }
  UnionOption.prototype.toString = unionOptionToString;
  UnionOption.prototype.equals = equalsProto;
  UnionOption.prototype.hashCode = hashCode;
  Object.keys(proto).forEach(k => UnionOption.prototype[k] = proto[k]);

  // put a ref on the union option class back to Union so we can trace things
  // back to see if they are from Union
  UnionOption.unionFactory = Union;

  const union = {
    options: options,
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

// deep-check equality between two union option instances, compatible with immutablejs
Union.is = _equals;


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
      return this.payload;
    } else {
      throw err;
    }
  },
  /**
   * @throws Error if it is None
   */
  unwrap() {
    if (this.name === 'Some') {
      return this.payload;
    } else {
      throw new Error('Tried to .unwrap() Maybe.None as Some');
    }
  },
  unwrapOr(def) {
    return (this.name === 'Some') ? this.payload : def;
  },
  unwrapOrElse(fn) {
    return (this.name === 'Some') ? this.payload : fn();
  },
  okOr(err) {
    return (this.name === 'Some') ? Result.Ok(this.payload) : Result.Err(err);
  },
  okOrElse(errFn) {
    return (this.name === 'Some') ? Result.Ok(this.payload) : Result.Err(errFn());
  },
  promiseOr(err) {
    return (this.name === 'Some') ? Promise.resolve(this.payload) : Promise.reject(err);
  },
  promiseOrElse(fn) {
    return (this.name === 'Some') ? Promise.resolve(this.payload) : Promise.reject(fn());
  },
  and(other) {
    return (this.name === 'Some') ? Maybe.Some(other) : this;
  },
  andThen(fn) {
    return (this.name === 'Some') ? Maybe.Some(fn(this.payload)) : this;
  },
  or(other) {
    return (this.name === 'Some') ? this : Maybe.Some(other);
  },
  orElse(fn) {
    return (this.name === 'Some') ? this : Maybe.Some(fn());
  },
  filter(fn) {
    return this.andThen(x => fn(x) ? this : Maybe.None());
  }
};


const maybeStatic = {
  all: (values) => values.reduce((res, next) =>
    res.andThen(resArr => Maybe.Some(next)
      .andThen(v => resArr.concat([v])))
  , Maybe.Some([])),
  undefined: val => (typeof val === 'undefined') ? Maybe.None() : Maybe.Some(val),
  null: val => val === null ? Maybe.None() : Maybe.Some(val),
  nan: val => (val !== val) ? Maybe.None() : Maybe.Some(val),
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
    return () => new UnionOptionClass(options, 'None');
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
    return (this.name === 'Ok') ? Maybe.Some(this.payload) : Maybe.None();
  },
  err() {
    return (this.name === 'Ok') ? Maybe.None() : Maybe.Some(this.payload);
  },
  promise() {
    return (this.name === 'Ok') ? Promise.resolve(this.payload) : Promise.reject(this.payload);
  },
  promiseErr() {
    return (this.name === 'Ok') ? Promise.reject(this.payload) : Promise.resolve(this.payload);
  },
  and(other) {
    return (this.name === 'Ok') ? Result.Ok(other) : this;
  },
  andThen(fn) {
    return (this.name === 'Ok') ? Result.Ok(fn(this.payload)) : this;
  },
  or(other) {
    return (this.name === 'Ok') ? this : Result.Ok(other);
  },
  orElse(fn) {
    return (this.name === 'Ok') ? this : Result.Ok(fn(this.payload));
  },
  unwrapOr(def) {
    return (this.name === 'Ok') ? this.payload : def;
  },
  unwrapOrElse(fn) {
    return (this.name === 'Ok') ? this.payload : fn(this.payload);
  },
  /**
   * @throws err
   */
  expect(err) {
    if (this.name === 'Ok') {
      return this.payload;
    } else {
      throw err;
    }
  },
  /**
   * @throws the value from Err(value)
   */
  unwrap() {
    if (this.name === 'Ok') {
      return this.payload;
    } else {
      throw this.payload;
    }
  },
  /**
   * @throws the value from Ok(value)
   */
  unwrapErr() {
    if (this.name === 'Ok') {
      let hint = '';
      if (this.payload && typeof this.payload.toString === 'function') {
        hint = `: ${this.payload.toString()}`;
      }
      throw new Error(`Tried to .unwrap() Result.Ok as Err${hint}`);
    } else {
      return this.payload;
    }
  },
};


const resultStatic = {
  all: (values) => values.reduce((res, next) =>
    res.andThen(resArr => Result.Ok(next)
      .andThen(v => resArr.concat([v])))
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

  Maybe,
  Some: Maybe.Some,
  None: Maybe.None,

  Result,
  Ok: Result.Ok,
  Err: Result.Err,
};
