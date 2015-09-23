/// <reference path="node.d.ts" />
/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */
/**
 * @throws EnumError.NonExhaustiveMatch
 */
declare function match(to: any): any;
interface EnumOption {
    options: any;
    name: String;
    data: any[];
    match: (paths: Object) => any;
    new (options: any, name: String, data: Array<any>): any;
}
declare function _factory(options: Object, name: string, EnumOptionClass: EnumOption): (...args: any[]) => EnumOption;
declare function Enum<T>(options: T, proto?: any, factory?: any): T;
declare var $: any;
declare var EnumErr: {
    BadOptionType: any;
    NonExhaustiveMatch: any;
};
declare var MaybeError: {
    UnwrapNone: any;
};
interface Maybe {
    Some: (someValue) => EnumOption;
    None: () => EnumOption;
}
interface MaybeOption {
    /**
     * @throws EnumError.NonExhaustiveMatch
     */
    match: (opts: Object) => any;
    isSome: () => Boolean;
    isNone: () => Boolean;
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
    Some: any;
    None: any;
};
declare var ResultError: {
    UnwrapErrAsOk: any;
    UnwrapErr: any;
};
interface Result {
    Ok: (okValue) => EnumOption;
    Err: (errValue) => EnumOption;
}
interface ResultOption {
    /**
     * @throws EnumError.NonExhaustiveMatch
     */
    match: (opts: Object) => any;
    isOk: () => Boolean;
    isErr: () => Boolean;
    ok: () => Maybe;
    err: () => Maybe;
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
declare var resultProto: ResultOption;
declare var Result: {
    Ok: any;
    Err: any;
};
