/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */
/// <reference path="./node.d.ts" />
/**
 * Object.assign ponyfill
 */
var assign = require('object-assign');
function covers(options, paths) {
    return paths.hasOwnProperty('_') ? true : options.every(function (opt) { return paths.hasOwnProperty(opt); }) && options.length === Object.keys(paths).length;
}
/**
 * @throws EnumError.NonExhaustiveMatch
 */
function match(paths) {
    if (!covers(this.options, paths)) {
        throw EnumErr.NonExhaustiveMatch();
    }
    return paths.hasOwnProperty(this.option) ? paths[this.option].apply(null, this.args) : paths['_'](this);
}
;
function Enum(options, proto) {
    if (proto === void 0) { proto = {}; }
    if (!options) {
        throw EnumErr.MissingOptions();
    }
    var arrOptions;
    if (!(options instanceof Array)) {
        if (options instanceof Object) {
            arrOptions = Object.keys(options);
        }
        else {
            throw EnumErr.BadOptionType();
        }
    }
    else {
        arrOptions = options; // sketchhhhhhhh
    }
    function EnumOption(options, option, args) {
        this.options = arrOptions;
        this.option = option;
        this.args = args;
    }
    function mkEnumOption(options, option) {
        var args = [];
        for (var i = 2, l = arguments.length; i < l; i++) {
            args.push(arguments[i]);
        }
        return new EnumOption(options, option, args);
    }
    EnumOption.prototype = assign({ match: match }, proto);
    return arrOptions.reduce(function (obj, opt) {
        obj[opt] = mkEnumOption.bind(null, options, opt);
        return obj;
    }, {});
}
var $;
var EnumErr = Enum({
    MissingOptions: $,
    BadOptionType: $,
    NonExhaustiveMatch: $,
});
var MaybeError = Enum({
    UnwrapNone: $,
});
var maybeProto = {
    isSome: function () {
        return this.option === 'Some';
    },
    isNone: function () {
        return this.option === 'None';
    },
    expect: function (err) {
        if (this.option === 'Some') {
            return this.args[0];
        }
        else {
            throw err;
        }
    },
    unwrap: function () {
        if (this.option === 'Some') {
            return this.args[0];
        }
        else {
            throw MaybeError.UnwrapNone('Tried to unwrap None');
        }
    },
    unwrapOr: function (def) {
        return (this.option === 'Some') ? this.args[0] : def;
    },
    unwrapOrElse: function (fn) {
        return (this.option === 'Some') ? this.args[0] : fn();
    },
    map: function (fn) {
        return (this.option === 'Some') ? Maybe.Some(fn(this.args[0])) : this;
    },
    mapOr: function (def, fn) {
        return (this.option === 'Some') ? fn(this.args[0]) : def;
    },
    mapOrElse: function (defFn, fn) {
        return (this.option === 'Some') ? fn(this.args[0]) : defFn();
    },
    okOr: function (err) {
        return (this.option === 'Some') ? Result.Ok(this.args[0]) : Result.Err(err);
    },
    okOrElse: function (errFn) {
        return (this.option === 'Some') ? Result.Ok(this.args[0]) : Result.Err(errFn());
    },
    array: function () {
        return (this.option === 'Some') ? [this.args[0]] : []; // .iter; .into_item
    },
    and: function (other) {
        return (this.option === 'Some') ? other : this;
    },
    andThen: function (fn) {
        return (this.option === 'Some') ? fn(this.args[0]) : this;
    },
    or: function (other) {
        return (this.option === 'Some') ? this : other;
    },
    orElse: function (fn) {
        return (this.option === 'Some') ? this : fn();
    },
    take: function () {
        if (this.option === 'Some') {
            var taken = Maybe.Some(this.args[0]);
            this.args[0] = undefined;
            this.option = 'None';
            return taken;
        }
        else {
            return Maybe.None();
        }
    },
};
var Maybe = Enum({
    Some: $,
    None: $,
}, maybeProto);
var ResultError = Enum({
    UnwrapErrAsOk: null,
    UnwrapErr: null,
});
var resultProto = {
    isOk: function () {
        return this.option === 'Ok';
    },
    isErr: function () {
        return this.option === 'Err';
    },
    ok: function () {
        return (this.option === 'Ok') ? Maybe.Some(this.args[0]) : Maybe.None();
    },
    err: function () {
        return (this.option === 'Ok') ? Maybe.None() : Maybe.Some(this.args[0]);
    },
    map: function (fn) {
        return (this.option === 'Ok') ? Result.Ok(fn(this.args[0])) : this;
    },
    mapErr: function (fn) {
        return (this.option === 'Ok') ? this : Result.Err(fn(this.args[0]));
    },
    array: function () {
        return (this.option === 'Ok') ? [this.args[0]] : []; // .iter; .into_item
    },
    and: function (other) {
        return (this.option === 'Ok') ? other : this;
    },
    andThen: function (fn) {
        return (this.option === 'Ok') ? fn(this.args[0]) : this;
    },
    or: function (other) {
        return (this.option === 'Ok') ? this : other;
    },
    orElse: function (fn) {
        return (this.option === 'Ok') ? this : fn(this.args[0]);
    },
    unwrapOr: function (def) {
        return (this.option === 'Ok') ? this.args[0] : def;
    },
    unwrapOrElse: function (fn) {
        return (this.option === 'Ok') ? this.args[0] : fn(this.args[0]);
    },
    unwrap: function () {
        if (this.option === 'Ok') {
            return this.args[0];
        }
        else {
            throw ResultError.UnwrapErr(this.args[0]);
        }
    },
    unwrapErr: function () {
        if (this.option === 'Ok') {
            throw ResultError.UnwrapErrAsOk(this.args[0]);
        }
        else {
            return this.args[0];
        }
    },
};
var Result = Enum({
    Ok: $,
    Err: $,
}, resultProto);
module.exports = {
    Enum: Enum,
    Maybe: Maybe,
    Some: Maybe.Some,
    None: Maybe.None,
    Result: Result,
    Ok: Result.Ok,
    Err: Result.Err,
};
