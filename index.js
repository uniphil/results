/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */

/**
 * @throws Error if the match is not exhaustive, or if there are weird keys
 */
'use strict';

function _match(to) {
  for (var k in to) {
    if (to.hasOwnProperty(k)) {
      if (!this.options.hasOwnProperty(k) && k !== '_') {
        throw new Error('Union match: unrecognized match option: \'' + k + '\'');
      }
    }
  }
  if (typeof to._ === 'function') {
    // match is de-facto exhaustive w/ `_`
    if (typeof to[this.name] === 'function') {
      return to[this.name].apply(null, this.data);
    } else {
      return to._(this);
    }
  } else {
    // ensure match is exhaustive
    for (var k in this.options) {
      if (typeof to[k] !== 'function') {
        throw new Error('Union match: Non-exhaustive match is missing \'' + k + '\'');
      }
    }
    return to[this.name].apply(null, this.data);
  }
};

function _factory(options, name, UnionOptionClass) {
  return function () {
    var data = [];
    for (var i = 0; i < arguments.length; i++) {
      data[i] = arguments[i];
    }
    return new UnionOptionClass(options, name, data);
  };
}

function Union(options) {
  var proto = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var static_ = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
  var factory = arguments.length <= 3 || arguments[3] === undefined ? _factory : arguments[3];

  function UnionOption(options, name, data) {
    this.options = options;
    this.name = name;
    this.data = data;
  }
  UnionOption.prototype = proto;
  if (typeof proto.match === 'undefined') {
    proto.match = _match;
  }
  if (!proto.hasOwnProperty('toString')) {
    proto.toString = function () {
      return '[UnionOption ' + this.name + '(' + this.data.join(', ') + ') ' + ('from Union { ' + Object.keys(this.options).join(', ') + ' }]');
    };
  }
  var union_ = Object.keys(options).reduce(function (obj, name) {
    obj[name] = factory(options, name, UnionOption);
    return obj;
  }, {});
  if (options.hasOwnProperty('toString')) {
    throw new Error('Union: cannot use reserved name `toString` as part of a Union');
  }
  union_.toString = function () {
    return '[Union { ' + Object.keys(options).join(', ') + ' }]';
  };
  for (var k in static_) {
    if (static_.hasOwnProperty(k)) {
      union_[k] = static_[k];
    }
  }
  if (union_.hasOwnProperty('OptionClass')) {
    throw new Error('Union: cannot use reserved name `UnionClass` as part of a Union');
  }
  union_.OptionClass = UnionOption;
  return union_;
}

var maybeProto = {
  _promote: function _promote(value) {
    if (value instanceof Maybe.OptionClass) {
      return value;
    } else {
      return Maybe.Some(value);
    }
  },
  /**
   * @throws Error if the match is not exhaustive
   */
  match: function match(paths) {
    return _match.call({
      options: this.options,
      name: this.name,
      data: [this.data]
    }, paths);
  },
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
      throw new Error('Maybe Union: Tried to .unwrap() None as Some');
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
    return this.name === 'Some' ? this._promote(other) : this;
  },
  andThen: function andThen(fn) {
    return this.name === 'Some' ? this._promote(fn(this.data)) : this;
  },
  or: function or(other) {
    return this.name === 'Some' ? this : this._promote(other);
  },
  orElse: function orElse(fn) {
    return this.name === 'Some' ? this : this._promote(fn());
  }
};

var maybeStatic = {
  all: function all(values) {
    return values.reduce(function (res, next) {
      return res.andThen(function (resArr) {
        return maybeProto._promote(next).andThen(function (v) {
          return Maybe.Some(resArr.concat(v));
        });
      });
    }, Maybe.Some([]));
  }
};

var Maybe = Union({
  Some: null,
  None: null
}, maybeProto, maybeStatic, function (options, name, UnionOptionClass) {
  if (name === 'Some') {
    return function (value) {
      if (value instanceof UnionOptionClass) {
        var unwrapped = value.unwrapOr(); // Some's value or Undefined
        return new UnionOptionClass(options, 'Some', unwrapped);
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

var ResultError = Union({
  UnwrapErrAsOk: null,
  UnwrapErr: null
});

var resultProto = {
  _promote: function _promote(value) {
    if (value instanceof Result.OptionClass) {
      return value;
    } else {
      return Result.Ok(value);
    }
  },
  /**
   * @throws Error if the match is not exhaustive
   */
  match: function match(paths) {
    return _match.call({
      options: this.options,
      name: this.name,
      data: [this.data]
    }, paths);
  },
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
    return this.name === 'Ok' ? this._promote(other) : this;
  },
  andThen: function andThen(fn) {
    return this.name === 'Ok' ? this._promote(fn(this.data)) : this;
  },
  or: function or(other) {
    return this.name === 'Ok' ? this : this._promote(other);
  },
  orElse: function orElse(fn) {
    return this.name === 'Ok' ? this : this._promote(fn(this.data));
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
      throw ResultError.UnwrapErr(this.data);
    }
  },
  /**
   * @throws the value from Ok(value)
   */
  unwrapErr: function unwrapErr() {
    if (this.name === 'Ok') {
      throw ResultError.UnwrapErrAsOk(this.data);
    } else {
      return this.data;
    }
  }
};

var resultStatic = {
  all: function all(values) {
    return values.reduce(function (res, next) {
      return res.andThen(function (resArr) {
        return resultProto._promote(next).andThen(function (v) {
          return Result.Ok(resArr.concat(v));
        });
      });
    }, Result.Ok([]));
  }
};

var Result = Union({
  Ok: null,
  Err: null
}, resultProto, resultStatic, function (options, name, UnionOptionClass) {
  if (name === 'Ok') {
    return function (value) {
      if (value instanceof UnionOptionClass) {
        var unwrapped = value.unwrapOrElse(function (e) {
          return e;
        });
        return new UnionOptionClass(options, 'Ok', unwrapped);
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