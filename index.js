/**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */
/// <reference path="./node.d.ts" />
var $;
function match(to) {
    for (var k in to) {
        if (to.hasOwnProperty(k)) {
            if (!this.options.hasOwnProperty(k) && k !== '_') {
                throw new Error("Union match: unrecognized match option: '" + k + "'");
            }
        }
    }
    if (typeof to._ === 'function') {
        if (typeof to[this.name] === 'function') {
            return to[this.name].apply(null, this.data);
        }
        else {
            return to._(this);
        }
    }
    else {
        for (var k in this.options) {
            if (typeof to[k] !== 'function') {
                throw new Error("Union match: Non-exhaustive match is missing '" + k + "'");
            }
        }
        return to[this.name].apply(null, this.data);
    }
}
;
function _factory(options, name, UnionOptionClass) {
    return function () {
        var data = [];
        for (var i = 0; i < arguments.length; i++) {
            data[i] = arguments[i];
        }
        return new UnionOptionClass(options, name, data);
    };
}
function Union(options, proto, static, factory) {
    if (proto === void 0) { proto = {}; }
    if (static === void 0) { static = {}; }
    if (factory === void 0) { factory = _factory; }
    function UnionOption(options, name, data) {
        this.options = options;
        this.name = name;
        this.data = data;
    }
    UnionOption.prototype = proto;
    if (typeof proto.match === 'undefined') {
        proto.match = match;
    }
    var union_ = Object.keys(options).reduce(function (obj, name) {
        obj[name] = factory(options, name, UnionOption);
        return obj;
    }, {});
    for (var k in static) {
        if (static.hasOwnProperty(k)) {
            union_[k] = static[k];
        }
    }
    return union_;
}
var maybeProto = {
    match: function (paths) {
        return match.call({
            options: this.options,
            name: this.name,
            data: [this.data]
        }, paths);
    },
    isSome: function () {
        return this.name === 'Some';
    },
    isNone: function () {
        return this.name === 'None';
    },
    expect: function (err) {
        if (this.name === 'Some') {
            return this.data;
        }
        else {
            throw err;
        }
    },
    unwrap: function () {
        if (this.name === 'Some') {
            return this.data;
        }
        else {
            throw new Error('Maybe Union: Tried to .unwrap() None as Some');
        }
    },
    unwrapOr: function (def) {
        return (this.name === 'Some') ? this.data : def;
    },
    unwrapOrElse: function (fn) {
        return (this.name === 'Some') ? this.data : fn();
    },
    map: function (fn) {
        return (this.name === 'Some') ? Maybe.Some(fn(this.data)) : this;
    },
    mapOr: function (def, fn) {
        return (this.name === 'Some') ? fn(this.data) : def;
    },
    mapOrElse: function (defFn, fn) {
        return (this.name === 'Some') ? fn(this.data) : defFn();
    },
    okOr: function (err) {
        return (this.name === 'Some') ? Result.Ok(this.data) : Result.Err(err);
    },
    okOrElse: function (errFn) {
        return (this.name === 'Some') ? Result.Ok(this.data) : Result.Err(errFn());
    },
    array: function () {
        return (this.name === 'Some') ? [this.data] : [];
    },
    and: function (other) {
        return (this.name === 'Some') ? other : this;
    },
    andThen: function (fn) {
        return (this.name === 'Some') ? fn(this.data) : this;
    },
    or: function (other) {
        return (this.name === 'Some') ? this : other;
    },
    orElse: function (fn) {
        return (this.name === 'Some') ? this : fn();
    },
};
var maybeStatic = {
    all: function (values) { return values.reduce(function (res, next) {
        return res.andThen(function (resArr) { return next.map(function (v) { return resArr.concat(v); }); });
    }, Maybe.Some([])); },
};
var Maybe = Union({
    Some: $,
    None: $,
}, maybeProto, maybeStatic, function (options, name, UnionOptionClass) {
    return name === 'Some' ?
        function (value) { return new UnionOptionClass(options, name, value); } :
        function () { return new UnionOptionClass(options, name, null); };
});
var ResultError = Union({
    UnwrapErrAsOk: null,
    UnwrapErr: null,
});
var resultProto = {
    match: function (paths) {
        return match.call({
            options: this.options,
            name: this.name,
            data: [this.data]
        }, paths);
    },
    isOk: function () {
        return this.name === 'Ok';
    },
    isErr: function () {
        return this.name === 'Err';
    },
    ok: function () {
        return (this.name === 'Ok') ? Maybe.Some(this.data) : Maybe.None();
    },
    err: function () {
        return (this.name === 'Ok') ? Maybe.None() : Maybe.Some(this.data);
    },
    map: function (fn) {
        return (this.name === 'Ok') ? Result.Ok(fn(this.data)) : this;
    },
    mapErr: function (fn) {
        return (this.name === 'Ok') ? this : Result.Err(fn(this.data));
    },
    array: function () {
        return (this.name === 'Ok') ? [this.data] : [];
    },
    and: function (other) {
        return (this.name === 'Ok') ? other : this;
    },
    andThen: function (fn) {
        return (this.name === 'Ok') ? fn(this.data) : this;
    },
    or: function (other) {
        return (this.name === 'Ok') ? this : other;
    },
    orElse: function (fn) {
        return (this.name === 'Ok') ? this : fn(this.data);
    },
    unwrapOr: function (def) {
        return (this.name === 'Ok') ? this.data : def;
    },
    unwrapOrElse: function (fn) {
        return (this.name === 'Ok') ? this.data : fn(this.data);
    },
    unwrap: function () {
        if (this.name === 'Ok') {
            return this.data;
        }
        else {
            throw ResultError.UnwrapErr(this.data);
        }
    },
    unwrapErr: function () {
        if (this.name === 'Ok') {
            throw ResultError.UnwrapErrAsOk(this.data);
        }
        else {
            return this.data;
        }
    },
};
var resultStatic = {
    all: function (values) { return values.reduce(function (res, next) {
        return res.andThen(function (resArr) { return next.map(function (v) { return resArr.concat(v); }); });
    }, Result.Ok([])); },
};
var Result = Union({
    Ok: $,
    Err: $,
}, resultProto, resultStatic, function (options, name, UnionOptionClass) {
    return function (value) { return new UnionOptionClass(options, name, value); };
});
module.exports = {
    Union: Union,
    Maybe: Maybe,
    Some: Maybe.Some,
    None: Maybe.None,
    Result: Result,
    Ok: Result.Ok,
    Err: Result.Err,
};
