/// <reference path="node.d.ts" />
declare var $: any;
declare function match(to: any): any;
interface UnionOption {
    options: any;
    name: String;
    data: any[];
    match: (paths: Object) => any;
    new (options: any, name: String, data: Array<any>): any;
}
declare function _factory(options: Object, name: string, UnionOptionClass: UnionOption): (...args: any[]) => UnionOption;
declare function Union<T>(options: T, proto?: any, static?: any, factory?: any): T;
interface Maybe {
    Some: (someValue: any) => MaybeOption;
    None: () => MaybeOption;
    all: (values: MaybeOption[]) => MaybeOption;
}
interface MaybeOption {
    match: (opts: Object) => any;
    isSome: () => Boolean;
    isNone: () => Boolean;
    expect: (err) => any;
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
}
declare var maybeProto: MaybeOption;
interface MaybeStatic {
    all: (values: ResultOption[]) => ResultOption;
}
declare var maybeStatic: MaybeStatic;
declare var Maybe: {
    Some: any;
    None: any;
};
declare var ResultError: {
    UnwrapErrAsOk: any;
    UnwrapErr: any;
};
interface Result {
    Ok: (okValue: any) => ResultOption;
    Err: (errValue: any) => ResultOption;
    all: (values: ResultOption[]) => ResultOption;
}
interface ResultOption {
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
    unwrap: () => any;
    unwrapErr: () => any;
}
declare var resultProto: ResultOption;
interface ResultStatic {
    all: (values: ResultOption[]) => ResultOption;
}
declare var resultStatic: ResultStatic;
declare var Result: {
    Ok: any;
    Err: any;
};
