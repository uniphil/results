"use strict";

/*
 * Rust-inspired result types for javascript
 *
 * Authors: mystor & uniphil
 */

var assign = require("object-assign");

var $; // key mirror
var errors = (function (s) {
  return Object.keys(s).reduce(function (o, k) {
    o[k] = k;return o;
  }, {});
})({
  MISSING_CASE: $,
  UNWRAP_NONE: $,
  UNWRAPERR_OK: $,
  UNWRAP_ERR: $ });
function error(errKey, message) {
  return {
    key: errKey,
    message: message,
    toString: function toString() {
      return this.key + ": " + (JSON.stringify(this.message) || this.message);
    } };
}

function mustHave(keys, obj) {
  if (!keys.every(Object.prototype.hasOwnProperty.bind(obj))) {
    var missingKeys = keys.filter(function (k) {
      return !obj.hasOwnProperty(k);
    }).join(", ");
    throw error(errors.MISSING_CASE, missingKeys);
  }
}

function _Some(value) {
  this._value = value;
}

_Some.prototype = {
  match: function match(cases) {
    mustHave(["Some", "None"], cases);
    return cases.Some(this._value);
  },
  isSome: function isSome() {
    return true;
  },
  isNone: function isNone() {
    return false;
  },
  expect: function expect(err) {
    return this._value;
  },
  unwrap: function unwrap() {
    return this._value;
  },
  unwrapOr: function unwrapOr(def) {
    return this._value;
  },
  unwrapOrElse: function unwrapOrElse(fn) {
    return this._value;
  },
  map: function map(fn) {
    return new _Some(fn(this._value));
  },
  mapOr: function mapOr(def, fn) {
    return fn(this._value);
  },
  mapOrElse: function mapOrElse(defFn, fn) {
    return fn(this._value);
  },
  okOr: function okOr(err) {
    return new _Ok(this._value);
  },
  okOrElse: function okOrElse(errFn) {
    return new _Ok(this._value);
  },
  array: function array() {
    return [this._value]; // .iter; .into_item
  },
  and: function and(optb) {
    return optb;
  },
  andThen: function andThen(fn) {
    return fn(this._value);
  },
  or: function or(optb) {
    return this;
  },
  orElse: function orElse(fn) {
    return this;
  },
  take: function take() {
    var taken = new _Some(this._value);
    assign(this, _None.prototype);
    delete this._value;
    return taken;
  } };

function _None() {}

_None.prototype = {
  match: function match(cases) {
    mustHave(["Some", "None"], cases);
    return cases.None();
  },
  isSome: function isSome() {
    return false;
  },
  isNone: function isNone() {
    return true;
  },
  expect: function expect(err) {
    throw err;
  },
  unwrap: function unwrap() {
    throw error(errors.UNWRAP_NONE, "Tried to unwrap None");
  },
  unwrapOr: function unwrapOr(def) {
    return def;
  },
  unwrapOrElse: function unwrapOrElse(fn) {
    return fn();
  },
  map: function map(fn) {
    return this;
  },
  mapOr: function mapOr(def, fn) {
    return def;
  },
  mapOrElse: function mapOrElse(defFn, fn) {
    return defFn();
  },
  okOr: function okOr(err) {
    return new _Err(err);
  },
  okOrElse: function okOrElse(errFn) {
    return new _Err(errFn());
  },
  array: function array() {
    return []; // .iter; .into_item
  },
  and: function and(optb) {
    return this;
  },
  andThen: function andThen(fn) {
    return this;
  },
  or: function or(optb) {
    return optb;
  },
  orElse: function orElse(fn) {
    return fn();
  },
  take: function take() {
    return new _None();
  } };

// builder tests: 201, 205ms

function _Ok(value) {
  this._value = value;
}

_Ok.prototype = {
  match: function match(cases) {
    mustHave(["Ok", "Err"], cases);
    return cases.Ok(this._value);
  },
  isOk: function isOk() {
    return true;
  },
  isErr: function isErr() {
    return false;
  },
  ok: function ok() {
    return new _Some(this._value);
  },
  err: function err() {
    return new _None();
  },
  map: function map(fn) {
    return new _Ok(fn(this._value));
  },
  mapErr: function mapErr(fn) {
    return this;
  },
  array: function array() {
    return [this._value]; // .iter; .into_item
  },
  and: function and(resb) {
    return resb;
  },
  andThen: function andThen(fn) {
    return fn(this._value);
  },
  or: function or(resb) {
    return this;
  },
  orElse: function orElse(fn) {
    return this;
  },
  unwrapOr: function unwrapOr(def) {
    return this._value;
  },
  unwrapOrElse: function unwrapOrElse(fn) {
    return this._value;
  },
  unwrap: function unwrap() {
    return this._value;
  },
  unwrapErr: function unwrapErr() {
    throw error(errors.UNWRAPERR_OK, this._value);
  } };

function _Err(errVal) {
  this._errVal = errVal;
}

_Err.prototype = {
  match: function match(cases) {
    mustHave(["Ok", "Err"], cases);
    return cases.Err(this._errVal);
  },
  isOk: function isOk() {
    return false;
  },
  isErr: function isErr() {
    return true;
  },
  ok: function ok() {
    return new _None();
  },
  err: function err() {
    return new _Some(this._errVal);
  },
  map: function map(fn) {
    return this;
  },
  mapErr: function mapErr(fn) {
    return new _Err(fn(this._errVal));
  },
  array: function array() {
    return []; // .iter; .into_item
  },
  and: function and(resb) {
    return this;
  },
  andThen: function andThen(fn) {
    return this;
  },
  or: function or(resb) {
    return resb;
  },
  orElse: function orElse(fn) {
    return fn(this._errVal);
  },
  unwrapOr: function unwrapOr(def) {
    return def;
  },
  unwrapOrElse: function unwrapOrElse(fn) {
    return fn(this._errVal);
  },
  unwrap: function unwrap() {
    throw error(errors.UNWRAP_ERR, this._errVal);
  },
  unwrapErr: function unwrapErr() {
    return this._errVal;
  } };

module.exports = {
  Some: function (v) {
    return new _Some(v);
  },
  None: function () {
    return new _None();
  },
  Ok: function (v) {
    return new _Ok(v);
  },
  Err: function (e) {
    return new _Err(e);
  },
  errors: errors };