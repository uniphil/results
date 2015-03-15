/**
 * Rust-inspired Result<T, E> and Option<T> wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */


var assign = require('object-assign');


var $;  // key mirror
var errors = ((s)=>Object.keys(s).reduce((o,k)=>{o[k]=k;return o;},{}))({
  MISSING_CASE: $,
  UNWRAP_NONE: $,
  UNWRAPERR_OK: $,
  UNWRAP_ERR: $,
});
function error(errKey, message) {
  return {
    key: errKey,
    message: message,
    toString: function() {
      return this.key + ': ' + (JSON.stringify(this.message) || this.message);
    },
  };
}


function mustHave(props, obj) {
  if (!props.every(Object.prototype.hasOwnProperty.bind(obj))) {
    var missingKeys = props.filter((k) => !obj.hasOwnProperty(k)).join(', ');
    throw error(errors.MISSING_CASE, missingKeys);
  }
}


function Option(isSome, value) {
  this._ = isSome
  this._value = value;
}

Option.prototype = {
  match: function match(cases) {
    mustHave(['Some', 'None'], cases);
    return this._ ? cases.Some(this._value) : cases.None();
  },
  isSome: function isSome() {
    return this._;
  },
  isNone: function isNone() {
    return !this._;
  },
  expect: function expect(err) {
    if (this._) {
      return this._value;
    } else {
      throw err;
    }
  },
  unwrap: function unwrap() {
    if (this._) {
      return this._value;
    } else {
      throw error(errors.UNWRAP_NONE, "Tried to unwrap None");
    }
  },
  unwrapOr: function unwrapOr(def) {
    return this._ ? this._value : def;
  },
  unwrapOrElse: function unwrapOrElse(fn) {
    return this._ ? this._value : fn();
  },
  map: function map(fn) {
    return this._ ? Some(fn(this._value)) : this;
  },
  mapOr: function mapOr(def, fn) {
    return this._ ? fn(this._value) : def;
  },
  mapOrElse: function mapOrElse(defFn, fn) {
    return this._ ? fn(this._value) : defFn();
  },
  okOr: function okOr(err) {
    return this._ ? Ok(this._value) : Err(err);
  },
  okOrElse: function okOrElse(errFn) {
    return this._ ? Ok(this._value) : Err(errFn());
  },
  array: function array() {
    return this._ ? [this._value] : [];  // .iter; .into_item
  },
  and: function and(other) {
    return this._ ? other : this;
  },
  andThen: function andThen(fn) {
    return this._ ? fn(this._value) : this;
  },
  or: function or(other) {
    return this._ ? this : other;
  },
  orElse: function orElse(fn) {
    return this._ ? this : fn();
  },
  take: function take() {
    if (this._) {
      var taken = Some(this._value);
      this._ = false;
      this._value = null;
      return taken;
    } else {
      return None();
    }
  },
};


function Result(isOk, value) {
  this._ = isOk;
  this._value = value;
}

Result.prototype = {
  match: function match(cases) {
    mustHave(['Ok', 'Err'], cases);
    return cases[this._ ? 'Ok' : 'Err'](this._value);
  },
  isOk: function isOk() {
    return this._;
  },
  isErr: function isErr() {
    return !this._;
  },
  ok: function ok() {
    return this._ ? Some(this._value) : None();
  },
  err: function err() {
    return this._ ? None() : Some(this._value);
  },
  map: function map(fn) {
    return this._ ? Ok(fn(this._value)) : this;
  },
  mapErr: function mapErr(fn) {
    return this._ ? this : Err(fn(this._value));
  },
  array: function array() {
    return this._ ? [this._value] : [];  // .iter; .into_item
  },
  and: function and(other) {
    return this._ ? other : this;
  },
  andThen: function andThen(fn) {
    return this._ ? fn(this._value) : this;
  },
  or: function or(other) {
    return this._ ? this : other;
  },
  orElse: function orElse(fn) {
    return this._ ? this : fn(this._value);
  },
  unwrapOr: function unwrapOr(def) {
    return this._ ? this._value : def;
  },
  unwrapOrElse: function unwrapOrElse(fn) {
    return this._ ? this._value : fn(this._value);
  },
  unwrap: function unwrap() {
    if (this._) {
      return this._value;
    } else {
      throw error(errors.UNWRAP_ERR, this._value);
    }
  },
  unwrapErr: function unwrapErr() {
    if (this._) {
      throw error(errors.UNWRAPERR_OK, this._value);
    } else {
      return this._value;
    }
  },
};


var Some = Option.Some = function Some(value) {
  return new Option(true, value);
}

var None = Option.None = function None() {
  return new Option(false, null);
}

var Ok = Result.Ok = function Ok(value) {
  return new Result(true, value);
}

var Err = Result.Err = function Err(errVal) {
  return new Result(false, errVal);
}


module.exports = {
  Option: Option,
  Some: Some,
  None: None,
  Result: Result,
  Ok: Ok,
  Err: Err,
  errors: errors,
};
