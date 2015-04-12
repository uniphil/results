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
/**
 * @throws EnumError.NonExhaustiveMatch
 */
function match(to) {
    if (typeof to._ === 'function') {
        if (typeof to[this.option] === 'function') {
            return to[this.option].apply(null, this.args);
        }
        else {
            return to._(this);
        }
    }
    else {
        for (var i = 0; i < this.options.length; i++) {
            if (typeof to[this.options[i]] !== 'function') {
                throw EnumErr.NonExhaustiveMatch();
            }
        }
        return to[this.option].apply(null, this.args);
    }
}
;
function _factory(options, option, EnumOptionClass) {
    return function () {
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        return new EnumOptionClass(options, option, args);
    };
}
function Enum(options, proto, factory) {
    if (proto === void 0) { proto = {}; }
    if (factory === void 0) { factory = _factory; }
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
        arrOptions = options;
    }
    function EnumOption(options, option, args) {
        this.options = options;
        this.option = option;
        this.args = args;
    }
    EnumOption.prototype = assign({ match: match }, proto);
    return arrOptions.reduce(function (obj, option) {
        obj[option] = factory(arrOptions, option, EnumOption);
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
    match: function (paths) {
        return match.call(assign({}, this, { args: [this.args] }), paths);
    },
    isSome: function () {
        return this.option === 'Some';
    },
    isNone: function () {
        return this.option === 'None';
    },
    expect: function (err) {
        if (this.option === 'Some') {
            return this.args;
        }
        else {
            throw err;
        }
    },
    unwrap: function () {
        if (this.option === 'Some') {
            return this.args;
        }
        else {
            throw MaybeError.UnwrapNone('Tried to unwrap None');
        }
    },
    unwrapOr: function (def) {
        return (this.option === 'Some') ? this.args : def;
    },
    unwrapOrElse: function (fn) {
        return (this.option === 'Some') ? this.args : fn();
    },
    map: function (fn) {
        return (this.option === 'Some') ? Maybe.Some(fn(this.args)) : this;
    },
    mapOr: function (def, fn) {
        return (this.option === 'Some') ? fn(this.args) : def;
    },
    mapOrElse: function (defFn, fn) {
        return (this.option === 'Some') ? fn(this.args) : defFn();
    },
    okOr: function (err) {
        return (this.option === 'Some') ? Result.Ok(this.args) : Result.Err(err);
    },
    okOrElse: function (errFn) {
        return (this.option === 'Some') ? Result.Ok(this.args) : Result.Err(errFn());
    },
    array: function () {
        return (this.option === 'Some') ? [this.args] : []; // .iter; .into_item
    },
    and: function (other) {
        return (this.option === 'Some') ? other : this;
    },
    andThen: function (fn) {
        return (this.option === 'Some') ? fn(this.args) : this;
    },
    or: function (other) {
        return (this.option === 'Some') ? this : other;
    },
    orElse: function (fn) {
        return (this.option === 'Some') ? this : fn();
    },
    take: function () {
        if (this.option === 'Some') {
            var taken = Maybe.Some(this.args);
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
}, maybeProto, function (options, option, EnumOptionClass) { return option === 'Some' ? function (value) { return new EnumOptionClass(options, option, value); } : function () { return new EnumOptionClass(options, option, null); }; });
var ResultError = Enum({
    UnwrapErrAsOk: null,
    UnwrapErr: null,
});
var resultProto = {
    match: function (paths) {
        return match.call(assign({}, this, { args: [this.args] }), paths);
    },
    isOk: function () {
        return this.option === 'Ok';
    },
    isErr: function () {
        return this.option === 'Err';
    },
    ok: function () {
        return (this.option === 'Ok') ? Maybe.Some(this.args) : Maybe.None();
    },
    err: function () {
        return (this.option === 'Ok') ? Maybe.None() : Maybe.Some(this.args);
    },
    map: function (fn) {
        return (this.option === 'Ok') ? Result.Ok(fn(this.args)) : this;
    },
    mapErr: function (fn) {
        return (this.option === 'Ok') ? this : Result.Err(fn(this.args));
    },
    array: function () {
        return (this.option === 'Ok') ? [this.args] : []; // .iter; .into_item
    },
    and: function (other) {
        return (this.option === 'Ok') ? other : this;
    },
    andThen: function (fn) {
        return (this.option === 'Ok') ? fn(this.args) : this;
    },
    or: function (other) {
        return (this.option === 'Ok') ? this : other;
    },
    orElse: function (fn) {
        return (this.option === 'Ok') ? this : fn(this.args);
    },
    unwrapOr: function (def) {
        return (this.option === 'Ok') ? this.args : def;
    },
    unwrapOrElse: function (fn) {
        return (this.option === 'Ok') ? this.args : fn(this.args);
    },
    unwrap: function () {
        if (this.option === 'Ok') {
            return this.args;
        }
        else {
            throw ResultError.UnwrapErr(this.args);
        }
    },
    unwrapErr: function () {
        if (this.option === 'Ok') {
            throw ResultError.UnwrapErrAsOk(this.args);
        }
        else {
            return this.args;
        }
    },
};
var Result = Enum({
    Ok: $,
    Err: $,
}, resultProto, function (options, option, EnumOptionClass) { return function (value) { return new EnumOptionClass(options, option, value); }; });
module.exports = {
    Enum: Enum,
    Maybe: Maybe,
    Some: Maybe.Some,
    None: Maybe.None,
    Result: Result,
    Ok: Result.Ok,
    Err: Result.Err,
};
