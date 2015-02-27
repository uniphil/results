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
  NONE_AS_SOME: $,
  OK_AS_ERR: $,
  ERR_AS_OK: $ });
function error(errKey, message) {
  return {
    key: errKey,
    message: message,
    toString: function toString() {
      return this.key + ": " + this.message;
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

function Some(value) {
  var o = function Option(cases) {
    mustHave(["Some", "None"], cases);
    return cases.Some(value);
  };
  o.isSome = function () {
    return true;
  };
  o.isNone = function () {
    return false;
  };
  o.expect = function (err) {
    return value;
  };
  o.unwrap = function () {
    return value;
  };
  o.unwrapOr = function (def) {
    return value;
  };
  o.unwrapOrElse = function (fn) {
    return value;
  };
  o.map = function (fn) {
    return Some(fn(value));
  };
  o.mapOr = function (def, fn) {
    return fn(value);
  };
  o.mapOrElse = function (defFn, fn) {
    return fn(value);
  };
  o.okOr = function (err) {
    return Ok(value);
  };
  o.okOrElse = function (errFn) {
    return Ok(value);
  };
  o.array = function () {
    return [value];
  }; // .iter; .into_iter
  o.and = function (optb) {
    return optb;
  };
  o.andThen = function (fn) {
    return fn(value);
  };
  o.or = function (optb) {
    return o;
  };
  o.orElse = function (fn) {
    return o;
  };
  o.take = function () {
    assign(o, None());return Some(value);
  };
  return o;
}

function None() {
  var o = function Option(cases) {
    mustHave(["Some", "None"], cases);
    return cases.None();
  };
  o.isSome = function () {
    return false;
  };
  o.isNone = function () {
    return true;
  };
  o.expect = function (err) {
    throw err;
  };
  o.unwrap = function () {
    throw error(errors.NONE_AS_SOME, "Tried to unwrap None as Some");
  };
  o.unwrapOr = function (def) {
    return def;
  };
  o.unwrapOrElse = function (fn) {
    return fn();
  };
  o.map = function (fn) {
    return o;
  };
  o.mapOr = function (def, fn) {
    return def;
  };
  o.mapOrElse = function (defFn, fn) {
    return defFn();
  };
  o.okOr = function (err) {
    return Err(err);
  };
  o.okOrElse = function (errFn) {
    return Err(errFn());
  };
  o.array = function () {
    return [];
  }; // .iter; .into_iter
  o.and = function (optb) {
    return o;
  };
  o.andThen = function (fn) {
    return o;
  };
  o.or = function (optb) {
    return optb;
  };
  o.orElse = function (fn) {
    return fn();
  };
  o.take = function () {
    return o;
  };
  return o;
}

function Ok(value) {
  var r = function Result(cases) {
    mustHave(["Ok", "Err"], cases);
    return cases.Ok(value);
  };
  r.isOk = function () {
    return true;
  };
  r.isErr = function () {
    return false;
  };
  r.ok = function () {
    return Some(value);
  };
  r.err = function () {
    return None();
  };
  r.map = function (fn) {
    return Ok(fn(value));
  };
  r.mapErr = function (fn) {
    return r;
  };
  r.array = function () {
    return [value];
  }; // .iter; .into_iter
  r.and = function (resb) {
    return resb;
  };
  r.andThen = function (fn) {
    return fn(value);
  };
  r.or = function (resb) {
    return r;
  };
  r.orElse = function (fn) {
    return r;
  };
  r.unwrapOr = function (def) {
    return value;
  };
  r.unwrapOrElse = function (fn) {
    return value;
  };
  r.unwrap = function () {
    return value;
  };
  r.unwrapErr = function () {
    throw error(errors.OK_AS_ERR, "Tried to unwrap Ok as Err");
  };
  return r;
}

function Err(errVal) {
  var r = function Result(cases) {
    mustHave(["Ok", "Err"], cases);
    return cases.Err(errVal);
  };
  r.isOk = function () {
    return false;
  };
  r.isErr = function () {
    return true;
  };
  r.ok = function () {
    return None();
  };
  r.err = function () {
    return Some(errVal);
  };
  r.map = function (fn) {
    return r;
  };
  r.mapErr = function (fn) {
    return Err(fn(errVal));
  };
  r.array = function () {
    return [];
  }; // .iter; .into_iter
  r.and = function (resb) {
    return r;
  };
  r.andThen = function (fn) {
    return r;
  };
  r.or = function (resb) {
    return resb;
  };
  r.orElse = function (fn) {
    return fn();
  };
  r.unwrapOr = function (def) {
    return def;
  };
  r.unwrapOrElse = function (fn) {
    return fn();
  };
  r.unwrap = function () {
    throw error(errors.ERR_AS_OK, "Tried to unwrap an Err as Ok");
  };
  r.unwrapErr = function () {
    return errVal;
  };
  return r;
}

module.exports = {
  Some: Some,
  None: None,
  Ok: Ok,
  Err: Err,
  errors: errors };