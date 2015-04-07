declare var require: any;
declare var assign: any;
declare var module: any;
/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @module results
 * @requires object-assign
 *
 * @author mystor
 * @author uniphil
 */
/**
 * Any user-provided value, including `undefined`
 * @typedef {T} value
 * @template T
 */
/**
 * Any user-provided throwable error, including `undefined`
 * @typedef {E} err
 * @template E
 */
/**
 * @callback valueCb
 * @param {value} value
 * @returns {value}
 */
/**
 * @callback errCb
 * @param {err} err
 * @returns {value}
 */
/**
 * @callback MaybeCb
 * @param {value} value
 * @returns {Maybe}
 */
declare var assign: any;
declare function covers(options: any, paths: any): boolean;
declare function match(paths: any): any;
declare function Enum(options: any, proto?: {}): any;
declare var EnumErr: any;
declare var MaybeError: any;
/**
 * @class
 * @example
 * function find(arr, test) {
 * for (var i=0; i<arr.length; i++) {
 *   if (test(arr[i])) {
 *     return Some(arr[i]);
 *   }
 *   return None();
 * }
 */
declare var Maybe: any;
declare var ResultError: any;
declare var Result: any;
