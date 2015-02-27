/*
 * Rust-inspired result types for javascript
 *
 * Authors: mystor & uniphil
 */

var assign = require('object-assign');


var $;  // key mirror
var errors = ((s)=>Object.keys(s).reduce((o,k)=>{o[k]=k;return o;},{}))({
  MISSING_CASE: $,
  NONE_AS_SOME: $,
  OK_AS_ERR: $,
  ERR_AS_OK: $,
});
function error(errKey, message) {
  return {
    key: errKey,
    message: message,
    toString: function() { return this.key + ': ' + this.message; },
  };
}


function mustHave(keys, obj) {
  if (!keys.every(Object.prototype.hasOwnProperty.bind(obj))) {
    var missingKeys = keys.filter((k) => !obj.hasOwnProperty(k)).join(', ');
    throw error(errors.MISSING_CASE, missingKeys);
  }
}


function Some(value) {
  var o = function Option(cases) {
    mustHave(['Some', 'None'], cases);
    return cases.Some(value);
  };
  o.isSome = () => true;
  o.isNone = () => false;
  o.expect = (err) => value;
  o.unwrap = () => value;
  o.unwrapOr = (def) => value;
  o.unwrapOrElse = (fn) => value;
  o.map = (fn) => Some(fn(value));
  o.mapOr = (def, fn) => fn(value);
  o.mapOrElse = (defFn, fn) => fn(value);
  o.okOr = (err) => Ok(value);
  o.okOrElse = (errFn) => Ok(value);
  o.array = () => [value];  // .iter; .into_iter
  o.and = (optb) => optb;
  o.andThen = (fn) => fn(value);
  o.or = (optb) => o;
  o.orElse = (fn) => o;
  o.take = () => { assign(o, None()); return Some(value) };
  return o;
}


function None() {
  var o = function Option(cases) {
    mustHave(['Some', 'None'], cases);
    return cases.None();
  };
  o.isSome = () => false;
  o.isNone = () => true;
  o.expect = (err) => { throw err };
  o.unwrap = () => { throw error(errors.NONE_AS_SOME, 'Tried to unwrap None as Some'); };
  o.unwrapOr = (def) => def;
  o.unwrapOrElse = (fn) => fn();
  o.map = (fn) => o;
  o.mapOr = (def, fn) => def;
  o.mapOrElse = (defFn, fn) => defFn();
  o.okOr = (err) => Err(err);
  o.okOrElse = (errFn) => Err(errFn());
  o.array = () => [];  // .iter; .into_iter
  o.and = (optb) => o;
  o.andThen = (fn) => o;
  o.or = (optb) => optb;
  o.orElse = (fn) => fn();
  o.take = () => o;
  return o;
}


function Ok(value) {
  var r = function Result(cases) {
    mustHave(['Ok', 'Err'], cases);
    return cases.Ok(value);
  };
  r.isOk = () => true;
  r.isErr = () => false;
  r.ok = () => Some(value);
  r.err = () => None();
  r.map = (fn) => Ok(fn(value));
  r.mapErr = (fn) => r;
  r.array = () => [value];  // .iter; .into_iter
  r.and = (resb) => resb;
  r.andThen = (fn) => fn(value);
  r.or = (resb) => r;
  r.orElse = (fn) => r;
  r.unwrapOr = (def) => value;
  r.unwrapOrElse = (fn) => value;
  r.unwrap = () => value;
  r.unwrapErr = () => { throw error(errors.OK_AS_ERR, 'Tried to unwrap Ok as Err'); };
  return r;
}


function Err(errVal) {
  var r = function Result(cases) {
    mustHave(['Ok', 'Err'], cases);
    return cases.Err(errVal);
  };
  r.isOk = () => false;
  r.isErr = () => true;
  r.ok = () => None();
  r.err = () => Some(errVal);
  r.map = (fn) => r;
  r.mapErr = (fn) => Err(fn(errVal));
  r.array = () => [];  // .iter; .into_iter
  r.and = (resb) => r;
  r.andThen = (fn) => r;
  r.or = (resb) => resb;
  r.orElse = (fn) => fn();
  r.unwrapOr = (def) => def;
  r.unwrapOrElse = (fn) => fn();
  r.unwrap = () => { throw error(errors.ERR_AS_OK, 'Tried to unwrap an Err as Ok'); };
  r.unwrapErr = () => errVal;
  return r;
}
          

module.exports = {
  Some: Some,
  None: None,
  Ok: Ok,
  Err: Err,
  errors: errors,
};
