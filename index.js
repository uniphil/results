/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */

'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _ = Symbol('Union match catch-all symbol');

/**
 * Custom error type from http://stackoverflow.com/a/17891099/1299695
 * @param {string} message An associated message to explain the error
 * @returns {Error} An instance of UnionError, which subclasses Error
 */
function UnionError(message) {
  var realErr = Error.call(this, message);
  this.name = realErr.name = 'UnionError';
  this.stack = realErr.stack;
  this.message = message;
}
UnionError.protoype = Object.create(Error.prototype, { constructor: {
    value: UnionError,
    writeable: true,
    configurable: true
  } });

/**
 * @throws Error when the match is not exhaustive
 * @throws Error when there are weird keys
 * @throws Error when `option` is the wrong type for this match
 * @param {EnumOption} option The instance to match against
 * @param {Object} paths The optionName: callback mapping
 * @returns {any} The result of calling the matching callback
 */
function _match(option, paths) {
  if (!(option instanceof this.OptionClass)) {
    throw new UnionError('match called on a non-member option: \'' + option + '\'');
  }
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.keys(paths)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var k = _step.value;

      if (!option.options.hasOwnProperty(k) && k !== '_' && k !== _) {
        // DEPRECATED symbol _
        throw new UnionError('unrecognized match option: \'' + k + '\'');
      }
    }
    // DEPRECATED: symbol [_] catch-all will be removed after 0.10
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

  if (typeof paths._ === 'function' || typeof paths[_] === 'function') {
    // match is de-facto exhaustive w/ `_`
    if (typeof paths[option.name] === 'function') {
      return paths[option.name].apply(paths, _toConsumableArray(option.data));
    } else {
      return (paths._ || paths[_])(option); // DEPRECATED symbol [_]
    }
  } else {
      // ensure match is exhaustive
      for (var k in option.options) {
        if (typeof paths[k] !== 'function') {
          if (typeof paths[k] === 'undefined') {
            throw new UnionError('Non-exhaustive match is missing \'' + k + '\'');
          } else {
            throw new UnionError('match expected a function for \'' + k + '\', but found a \'' + typeof paths[k] + '\'');
          }
        }
      }
      return paths[option.name].apply(paths, _toConsumableArray(option.data));
    }
}

function unionOptionToString() {
  return '[UnionOption ' + this.name + '(' + this.data.join(', ') + ') ' + ('from Union { ' + Object.keys(this.options).join(', ') + ' }]');
}

function _factory(options, name, UnionOptionClass) {
  return function () {
    for (var _len = arguments.length, data = Array(_len), _key = 0; _key < _len; _key++) {
      data[_key] = arguments[_key];
    }

    return new UnionOptionClass(options, name, data);
  };
}

function Union(options) {
  var proto = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var static_ = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
  var factory = arguments.length <= 3 || arguments[3] === undefined ? _factory : arguments[3];

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
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = Object.keys(static_)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var k = _step2.value;

      if (options.hasOwnProperty(k)) {
        throw new UnionError('Cannot add static method \'' + k + '\' to Union which ' + ('has the same name as a member (members: ' + options.join(', ') + ').'));
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

  if (options.hasOwnProperty('_')) {
    // DEPRECATED
    console.warn('DEPRECATION WARNING: The union member name "_" will be reserved and throw an error in the next version of Results.');
  }
  function UnionOption(options, name, data) {
    this.options = options;
    this.name = name;
    this.data = data;
  }
  UnionOption.prototype = _extends({
    toString: unionOptionToString
  }, proto);
  var union = _extends({
    OptionClass: UnionOption,
    toString: function toString() {
      return '[Union { ' + Object.keys(options).join(', ') + ' }]';
    },
    match: _match
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
      return this.data;
    } else {
      throw err;
    }
  },
  /**
   * @throws Error if it is None
   */
  unwrap: function unwrap() {
    if (this.name === 'Some') {
      return this.data;
    } else {
      throw new UnionError('Tried to .unwrap() Maybe.None as Some');
    }
  },
  unwrapOr: function unwrapOr(def) {
    return this.name === 'Some' ? this.data : def;
  },
  unwrapOrElse: function unwrapOrElse(fn) {
    return this.name === 'Some' ? this.data : fn();
  },
  okOr: function okOr(err) {
    return this.name === 'Some' ? Result.Ok(this.data) : Result.Err(err);
  },
  okOrElse: function okOrElse(errFn) {
    return this.name === 'Some' ? Result.Ok(this.data) : Result.Err(errFn());
  },
  promiseOr: function promiseOr(err) {
    return this.name === 'Some' ? Promise.resolve(this.data) : Promise.reject(err);
  },
  promiseOrElse: function promiseOrElse(fn) {
    return this.name === 'Some' ? Promise.resolve(this.data) : Promise.reject(fn());
  },
  and: function and(other) {
    return this.name === 'Some' ? Maybe.Some(other) : this;
  },
  andThen: function andThen(fn) {
    return this.name === 'Some' ? Maybe.Some(fn(this.data)) : this;
  },
  or: function or(other) {
    return this.name === 'Some' ? this : Maybe.Some(other);
  },
  orElse: function orElse(fn) {
    return this.name === 'Some' ? this : Maybe.Some(fn());
  }
};

var maybeStatic = {
  match: function match(option, paths) {
    var normalOption = new this.OptionClass(option.options, option.name, [option.data]);
    return _match.call(this, normalOption, paths);
  },
  all: function all(values) {
    return values.reduce(function (res, next) {
      return res.andThen(function (resArr) {
        return Maybe.Some(next).andThen(function (v) {
          return resArr.concat(v);
        });
      });
    }, Maybe.Some([]));
  },
  undefined: function undefined(val) {
    return typeof val === 'undefined' ? Maybe.None() : Maybe.Some(val);
  },
  'null': function _null(val) {
    return val === null ? Maybe.None() : Maybe.Some(val);
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
      return new UnionOptionClass(options, 'None', null);
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
    return this.name === 'Ok' ? Maybe.Some(this.data) : Maybe.None();
  },
  err: function err() {
    return this.name === 'Ok' ? Maybe.None() : Maybe.Some(this.data);
  },
  promise: function promise() {
    return this.name === 'Ok' ? Promise.resolve(this.data) : Promise.reject(this.data);
  },
  promiseErr: function promiseErr() {
    return this.name === 'Ok' ? Promise.reject(this.data) : Promise.resolve(this.data);
  },
  and: function and(other) {
    return this.name === 'Ok' ? Result.Ok(other) : this;
  },
  andThen: function andThen(fn) {
    return this.name === 'Ok' ? Result.Ok(fn(this.data)) : this;
  },
  or: function or(other) {
    return this.name === 'Ok' ? this : Result.Ok(other);
  },
  orElse: function orElse(fn) {
    return this.name === 'Ok' ? this : Result.Ok(fn(this.data));
  },
  unwrapOr: function unwrapOr(def) {
    return this.name === 'Ok' ? this.data : def;
  },
  unwrapOrElse: function unwrapOrElse(fn) {
    return this.name === 'Ok' ? this.data : fn(this.data);
  },
  /**
   * @throws the value from Err(value)
   */
  unwrap: function unwrap() {
    if (this.name === 'Ok') {
      return this.data;
    } else {
      throw new UnionError('tried to .unwrap() Result.Err as Ok');
    }
  },
  /**
   * @throws the value from Ok(value)
   */
  unwrapErr: function unwrapErr() {
    if (this.name === 'Ok') {
      throw new UnionError('Tried to .unwrap() Result.Ok as Err');
    } else {
      return this.data;
    }
  }
};

var resultStatic = {
  match: function match(option, paths) {
    var normalOption = new this.OptionClass(option.options, option.name, [option.data]);
    return _match.call(this, normalOption, paths);
  },
  all: function all(values) {
    return values.reduce(function (res, next) {
      return res.andThen(function (resArr) {
        return Result.Ok(next).andThen(function (v) {
          return resArr.concat(v);
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
  UnionError: UnionError,
  _: _, // DEPRECATED

  Maybe: Maybe,
  Some: Maybe.Some,
  None: Maybe.None,

  Result: Result,
  Ok: Result.Ok,
  Err: Result.Err
};