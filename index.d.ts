/// <reference path="node.d.ts" />
/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */
/**
 * Object.assign ponyfill
 */
declare var assign: (...objs: Object[]) => Object;
/**
 * @throws EnumError.NonExhaustiveMatch
 */
declare function match(to: any): any;
interface EnumOption {
    match: (paths: Object) => any;
}
declare function _factory(options: string[], option: string, EnumOptionClass: any): () => any;
declare function Enum<T>(options: T | string[], proto?: {}, factory?: any): T;
declare var $: any;
declare var EnumErr: {
    [x: number]: undefined;
    MissingOptions: any;
    BadOptionType: any;
    NonExhaustiveMatch: any;
};
declare var MaybeError: {
    [x: number]: undefined;
    UnwrapNone: any;
};
interface Maybe {
    Some: (someValue) => EnumOption;
    None: () => EnumOption;
}
interface MaybeOption {
    isSome: () => boolean;
    isNone: () => boolean;
    /**
     * @throws whatever is passed as the arg
     */
    expect: (err) => any;
    /**
     * @throws MaybeError.UnwrapNone
     */
    unwrap: () => any;
    unwrapOr: (def) => any;
    unwrapOrElse: (fn: () => any) => any;
    map: (fn: (someValue) => any) => Maybe;
    mapOr: (def, fn: (someValue) => any) => any;
    mapOrElse: (defFn: () => any, fn: (someValue) => any) => any;
    okOr: (err) => Result;
    okOrElse: (errFn: () => any) => Result;
    array: () => Array<any>;
    and: (other: Maybe) => Maybe;
    andThen: (fn: (someValue) => Maybe) => Maybe;
    or: (other: Maybe) => Maybe;
    orElse: (fn: () => Maybe) => Maybe;
    take: () => Maybe;
}
declare var maybeProto: MaybeOption;
declare var Maybe: {
    [x: number]: undefined;
    Some: any;
    None: any;
};
declare var ResultError: {
    [x: number]: any;
    UnwrapErrAsOk: any;
    UnwrapErr: any;
};
interface Result {
    Ok: (okValue) => EnumOption;
    Err: (errValue) => EnumOption;
}
interface ResultOption {
    isOk: boolean;
    isErr: boolean;
    ok: Maybe;
    err: Maybe;
    map: (fn: (okValue) => any) => Result;
    mapErr: (fn: (errValue) => any) => Result;
    array: () => Array<any>;
    and: (other: Result) => Result;
    andThen: (fn: (okValue) => Result) => Result;
    or: (other: Result) => Result;
    orElse: (fn: (errValue) => Result) => Result;
    unwrapOr: (def: any) => any;
    unwrapOrElse: (fn: (errValue) => any) => any;
    /**
     * @throws the value from Err(value)
     */
    unwrap: () => any;
    /**
     * @throws the value from Ok(value)
     */
    unwrapErr: () => any;
}
declare var resultProto: {
    match(paths: any): any;
    isOk(): boolean;
    isErr(): boolean;
    ok(): any;
    err(): any;
    map(fn: any): any;
    mapErr(fn: any): any;
    array(): any[];
    and(other: any): any;
    andThen(fn: any): any;
    or(other: any): any;
    orElse(fn: any): any;
    unwrapOr(def: any): any;
    unwrapOrElse(fn: any): any;
    unwrap(): any;
    unwrapErr(): any;
};
declare var Result: {
    [x: number]: undefined;
    Ok: any;
    Err: any;
};
