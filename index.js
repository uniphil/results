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
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function match(option, paths) {
  if (!(option instanceof this.OptionClass)) {
    if (process.env.NODE_ENV !== 'production' && process) {
      console.error('Not a member from { ' + Object.keys(paths).join(', ') + ' }:', option);
    }
    throw new Error('match called on a non-member option: \'' + String(option) + '\'. ' + ('Expected a member from Union{ ' + Object.keys(paths).join(', ') + ' }'));
  }
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.keys(paths)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var k = _step.value;

      if (!option.options.hasOwnProperty(k) && k !== '_') {
        throw new Error('unrecognized match option: \'' + k + '\'');
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  if (typeof paths._ === 'function') {
    // match is de-facto exhaustive w/ `_`
    if (typeof paths[option.name] === 'function') {
      return paths[option.name](option.payload);
    } else {
      return paths._(option.payload);
    }
  } else {
    // ensure match is exhaustive
    for (var k in option.options) {
      if (typeof paths[k] !== 'function') {
        if (typeof paths[k] === 'undefined') {
          throw new Error('Non-exhaustive match is missing \'' + k + '\'');
        } else {
          throw new Error('match expected a function for \'' + k + '\', but found a \'' + typeof paths[k] + '\'');
        }
      }
    }
    return paths[option.name](option.payload);
  }
}

// Useful in general, but specifically motivated by and inspired by immutablejs
// https://github.com/facebook/immutable-js/blob/master/src/is.js
function _equals(_x4, _x5) {
  var _again = true;

  _function: while (_again) {
    var a = _x4,
        b = _x5;
    _again = false;

    if (a === b || a !== a && b !== b) {
      // true for NaNs
      return true;
    }

    if (!a || !b) {
      return false;
    }

    // There is probably a cleaner way to do this check
    // Blame TDD :)
    if (a && typeof a.constructor === 'function' && a.constructor.unionFactory === Union) {
      if (!(b && typeof b.constructor === 'function' && b.constructor.unionFactory === Union)) {
        return false;
      }
      if (a.constructor !== b.constructor) {
        return false;
      }
      if (a.name !== b.name) {
        return false;
      }
      _x4 = a.payload;
      _x5 = b.payload;
      _again = true;
      continue _function;
    }

    // I hate this block. Blame immutablejs :)
    if (typeof a.valueOf === 'function' && typeof b.valueOf === 'function') {
      a = a.valueOf();
      b = b.valueOf();
      if (a === b || a !== a && b !== b) {
        return true;
      }
      if (!a || !b) {
        return false;
      }
    }
    if (typeof a.equals === 'function' && typeof b.equals === 'function') {
      return a.equals(b);
    }
    return false;
  }
}

function equalsProto(other) {
  return _equals(this, other);
}

function hashCode() {
  return 42; // TODO: this is valid, but inefficient. Actually implement this :)
}

function unionOptionToString() {
  return '[' + this.name + '(' + this.payload + ') ' + ('from Union{ ' + Object.keys(this.options).join(', ') + ' }]');
}

function _factory(options, name, UnionOptionClass) {
  return function (payload) {
    return new UnionOptionClass(options, name, payload);
  };
}

function Union(options) {
  var proto = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var static_ = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
  var factory = arguments.length <= 3 || arguments[3] === undefined ? _factory : arguments[3];

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
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = Object.keys(static_)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var k = _step2.value;

      if (options.hasOwnProperty(k)) {
        throw new Error('Cannot add static method \'' + k + '\' to Union which ' + ('has the same name as a member (members: ' + options.join(', ') + ').'));
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2['return']) {
        _iterator2['return']();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
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
  Object.keys(proto).forEach(function (k) {
    return UnionOption.prototype[k] = proto[k];
  });

  // put a ref on the union option class back to Union so we can trace things
  // back to see if they are from Union
  UnionOption.unionFactory = Union;

  var union = _extends({
    options: options,
    OptionClass: UnionOption,
    toString: function toString() {
      return '[Union { ' + Object.keys(options).join(', ') + ' }]';
    },
    match: match
  }, static_);
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = Object.keys(options)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var _name = _step3.value;

      union[_name] = factory(options, _name, UnionOption);
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3['return']) {
        _iterator3['return']();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  return union;
}

// deep-check equality between two union option instances, compatible with immutablejs
Union.is = _equals;

var maybeProto = {
  isSome: function isSome() {
    return this.name === 'Some';
  },
  isNone: function isNone() {
    return this.name === 'None';
  },
  /**
   * @throws whatever is passed as the arg
   */
  expect: function expect(err) {
    if (this.name === 'Some') {
      return this.payload;
    } else {
      throw err;
    }
  },
  /**
   * @throws Error if it is None
   */
  unwrap: function unwrap() {
    if (this.name === 'Some') {
      return this.payload;
    } else {
      throw new Error('Tried to .unwrap() Maybe.None as Some');
    }
  },
  unwrapOr: function unwrapOr(def) {
    return this.name === 'Some' ? this.payload : def;
  },
  unwrapOrElse: function unwrapOrElse(fn) {
    return this.name === 'Some' ? this.payload : fn();
  },
  okOr: function okOr(err) {
    return this.name === 'Some' ? Result.Ok(this.payload) : Result.Err(err);
  },
  okOrElse: function okOrElse(errFn) {
    return this.name === 'Some' ? Result.Ok(this.payload) : Result.Err(errFn());
  },
  promiseOr: function promiseOr(err) {
    return this.name === 'Some' ? Promise.resolve(this.payload) : Promise.reject(err);
  },
  promiseOrElse: function promiseOrElse(fn) {
    return this.name === 'Some' ? Promise.resolve(this.payload) : Promise.reject(fn());
  },
  and: function and(other) {
    return this.name === 'Some' ? Maybe.Some(other) : this;
  },
  andThen: function andThen(fn) {
    return this.name === 'Some' ? Maybe.Some(fn(this.payload)) : this;
  },
  or: function or(other) {
    return this.name === 'Some' ? this : Maybe.Some(other);
  },
  orElse: function orElse(fn) {
    return this.name === 'Some' ? this : Maybe.Some(fn());
  },
  filter: function filter(fn) {
    var _this = this;

    return this.andThen(function (x) {
      return fn(x) ? _this : Maybe.None();
    });
  }
};

var maybeStatic = {
  all: function all(values) {
    return values.reduce(function (res, next) {
      return res.andThen(function (resArr) {
        return Maybe.Some(next).andThen(function (v) {
          return resArr.concat([v]);
        });
      });
    }, Maybe.Some([]));
  },
  undefined: function undefined(val) {
    return typeof val === 'undefined' ? Maybe.None() : Maybe.Some(val);
  },
  'null': function _null(val) {
    return val === null ? Maybe.None() : Maybe.Some(val);
  },
  nan: function nan(val) {
    return val !== val ? Maybe.None() : Maybe.Some(val);
  }
};

var Maybe = Union({
  Some: null,
  None: null
}, maybeProto, maybeStatic, function (options, name, UnionOptionClass) {
  if (name === 'Some') {
    return function (value) {
      if (value instanceof UnionOptionClass) {
        return value;
      } else {
        return new UnionOptionClass(options, 'Some', value);
      }
    };
  } else {
    // None
    return function () {
      return new UnionOptionClass(options, 'None');
    };
  }
});

var resultProto = {
  isOk: function isOk() {
    return this.name === 'Ok';
  },
  isErr: function isErr() {
    return this.name === 'Err';
  },
  ok: function ok() {
    return this.name === 'Ok' ? Maybe.Some(this.payload) : Maybe.None();
  },
  err: function err() {
    return this.name === 'Ok' ? Maybe.None() : Maybe.Some(this.payload);
  },
  promise: function promise() {
    return this.name === 'Ok' ? Promise.resolve(this.payload) : Promise.reject(this.payload);
  },
  promiseErr: function promiseErr() {
    return this.name === 'Ok' ? Promise.reject(this.payload) : Promise.resolve(this.payload);
  },
  and: function and(other) {
    return this.name === 'Ok' ? Result.Ok(other) : this;
  },
  andThen: function andThen(fn) {
    return this.name === 'Ok' ? Result.Ok(fn(this.payload)) : this;
  },
  or: function or(other) {
    return this.name === 'Ok' ? this : Result.Ok(other);
  },
  orElse: function orElse(fn) {
    return this.name === 'Ok' ? this : Result.Ok(fn(this.payload));
  },
  unwrapOr: function unwrapOr(def) {
    return this.name === 'Ok' ? this.payload : def;
  },
  unwrapOrElse: function unwrapOrElse(fn) {
    return this.name === 'Ok' ? this.payload : fn(this.payload);
  },
  /**
   * @throws err
   */
  expect: function expect(err) {
    if (this.name === 'Ok') {
      return this.payload;
    } else {
      throw err;
    }
  },
  /**
   * @throws the value from Err(value)
   */
  unwrap: function unwrap() {
    if (this.name === 'Ok') {
      return this.payload;
    } else {
      throw this.payload;
    }
  },
  /**
   * @throws the value from Ok(value)
   */
  unwrapErr: function unwrapErr() {
    if (this.name === 'Ok') {
      var hint = '';
      if (this.payload && typeof this.payload.toString === 'function') {
        hint = ': ' + this.payload.toString();
      }
      throw new Error('Tried to .unwrap() Result.Ok as Err' + hint);
    } else {
      return this.payload;
    }
  }
};

var resultStatic = {
  all: function all(values) {
    return values.reduce(function (res, next) {
      return res.andThen(function (resArr) {
        return Result.Ok(next).andThen(function (v) {
          return resArr.concat([v]);
        });
      });
    }, Result.Ok([]));
  },
  'try': function _try(maybeThrows) {
    try {
      return Result.Ok(maybeThrows());
    } catch (err) {
      return Result.Err(err);
    }
  }
};

var Result = Union({
  Ok: null,
  Err: null
}, resultProto, resultStatic, function (options, name, UnionOptionClass) {
  if (name === 'Ok') {
    return function (value) {
      if (value instanceof UnionOptionClass) {
        return value;
      } else {
        return new UnionOptionClass(options, 'Ok', value);
      }
    };
  } else {
    return function (err) {
      return new UnionOptionClass(options, 'Err', err);
    };
  }
});

module.exports = {
  Union: Union,

  Maybe: Maybe,
  Some: Maybe.Some,
  None: Maybe.None,

  Result: Result,
  Ok: Result.Ok,
  Err: Result.Err
};