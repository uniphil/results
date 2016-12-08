var assert = require('assert');
try {
  var Immutable = require('immutable');
} catch (err) {
  throw new Error('Immutablejs must be installed to run tests');
}
var { Union, Result, Ok, Err, Maybe, Some, None } = require('./index');


describe('Union', () => {
  it('should fail if options are missing', () => {
    assert.throws(() => Union());
  });
  it('should accept an object', () => {
    const U = Union({A: null});
    assert.equal(U.match(U.A(), {A: () => 42}), 42);
  });
  it('should.. work for empty object... I guess', () => {
    assert.ok(Union({}));
  });
  it('should stringify nicely', () => {
    assert.equal(String(Union({A: null})), '[Union { A }]');
    assert.equal(String(Union({A: null, B: null})), '[Union { A, B }]');
    const u = Union({A: null});
    assert.equal(String(u.A()), `[A(undefined) from Union{ A }]`);
    assert.equal(String(u.A(1)), `[A(1) from Union{ A }]`);
  });
  describe('.equals', () => {
    const U = Union({A: null, B: null});
    const ae1 = U.A();
    const ae2 = U.A();
    const a1a = U.A('a');
    const a1a2 = U.A('a');
    const a1ab = U.A('b');
    const be1 = U.B();
    const b1a = U.B('a');
    const ar = U.A(U.A(U.A()));
    const ar2 = U.A(U.A(U.A()));
    const arn = U.A(U.A(U.B()));
    it('should be true for the same instance', () => {
      assert.ok(ae1.equals(ae1));
    });
    it('should be true for the same member with the same params', () => {
      assert.ok(ae1.equals(ae2));
      assert.ok(a1a.equals(a1a2));
    });
    it('should be false for the same member with different params', () => {
      assert.ifError(ae1.equals(a1a));
      assert.ifError(a1a.equals(a1ab));
    });
    it('should be false for different members with any params', () => {
      assert.ifError(ae1.equals(be1));
      assert.ifError(a1a.equals(b1a));
    });
    it('should check recursively', () => {
      assert.ok(ar.equals(ar2));
      assert.ifError(ar.equals(arn));
    });
    it('should return false for another instance implementing .equals', () => {
      const alien = { equals: () => true };
      assert.ifError(ae1.equals(alien));
    });
  });
  describe('.hashCode', () => {
    it('should return a 32-bit int', () => {
      const hashCode = Union({A: null}).A().hashCode();
      assert.strictEqual(Number(hashCode), hashCode);
      assert.equal(hashCode % 1, 0);  // remainder zero only if it's an int
    });
    it('should be equal for equivalent members', () => {
      const { A } = Union({A: null});
      assert.equal(A().hashCode(), A().hashCode());
      assert.equal(A(1).hashCode(), A(1).hashCode());
    });
  });
  describe('.match', () => {
    it('should throw if the instance is not from this union', () => {
      const U1 = Union({A: null});
      const U2 = Union({A: null});
      assert.throws(() => U1.match(U2.A(), {A: () => 1}));
      try {
        U1.match(U2.A(1), {A: () => 1});
        assert.fail('should have thrown for non-member');
      } catch (err) {
        assert.equal(err.message, 'match called on a non-member option: \'[A(1) from Union{ A }]\'. Expected a member from Union{ A }');
      }
    });
    it('should throw if the match paths are not exhaustive', () => {
      const U = Union({A: 0, B: 0});
      assert.throws(() => U.match(U.A(), {a: () => 'whatever'}));
    });
    it('should allow literal _ as a key (not just the imported symbol)', () => {
      const U = Union({A: 0, B: 0});
      assert.equal(U.match(U.A(), {_: () => 42}), 42);
      assert.equal(U.match(U.B(), {_: () => 42}), 42);
    });
    it('should pass a value to `match` callbacks', () => {
      const U = Union({A: 1});
      assert.equal(U.match(U.A(42), {A: (v) => v}), 42);
    });
    it('should apply its payloads to the catch-all handler', () => {
      const U = Union({A: 1});
      assert.equal(U.match(U.A(42), {_: n => n}), 42);
    });
    it('should throw for unrecognized keys', () => {
      var U = Union({A: 0, B: 1});
      var f = () => null;
      assert.throws(() => U.match(U.A(), {A: f, B: f, C: f}));
    });
    it('should give a useful error message for a non-function match prop', () => {
      const U = Union({A: {}});
      try {
        U.match(U.A(), {});
        assert.fail('should have thrown');
      } catch (err) {
        assert(err instanceof Error);
        assert.equal(err.message, `Non-exhaustive match is missing 'A'`);
      }
      try {
        U.match(U.A(), {A: 1});
        assert.fail('should have thrown');
      } catch (err) {
        assert.equal(err.message, `match expected a function for 'A', but found a 'number'`);
      }
    });
  });
  describe('.options', () => {
    it('should be exposed', () => {
      const U = Union({A: null});
      assert.deepEqual(U.options, {A: null});
    });
    it('should have all the options', () => {
      const U = Union({A: null, B: null, C: null});
      assert.deepEqual(U.options, {A: null, B: null, C: null});
    });
    it('should throw if constructed with `options` as an option', () => {
      assert.throws(() => Union({options: null}));
    });
  });
  describe('errors thrown by results', () => {
    it('should be instance of Error', () => {
      assert.throws(() => Union());  // no members
      try {
        Union();
      } catch (err) {
        assert(err instanceof Error);
      }
    });
  });
  describe('is', () => {
    it('should deep-check equality for two union option members', () => {
      const U = Union({A: null});
      assert.ok(Union.is(U.A(1), U.A(1)));
      assert.ifError(Union.is(U.A(1), U.A(2)));
    });
  });
});


describe('Maybe', () => {
  it('should map to Some or None callbacks', () => {
    assert.equal(Maybe.match(Some(1), {Some: (v) => v, None: () => null}), 1);
    assert.equal(Maybe.match(None(), {Some: () => null, None: () => 1}), 1);
  });
  it('should self-identify', () => {
    assert.ok(Some(1).isSome());
    assert.ok(None().isNone());
  });
  it('should other-anti-identify', () => {
    assert.equal(Some(1).isNone(), false);
    assert.equal(None().isSome(), false);
  });
  it('.Some should use Maybes given to it', () => {
    assert.equal(Some(Some(1)).unwrap(), 1);
    assert.equal(Some(None()).isNone(), true);
  });
  it('should throw or not for expect', () => {
    assert.doesNotThrow(() => {Some(1).expect('err')});
    assert.throws(() => {None().expect('err')}, 'err');
  });
  it('should unwrap or throw', () => {
    assert.equal(Some(1).unwrap(), 1);
    assert.throws(() => None().unwrap());
  });
  it('should unwrap its value or a default for unwrapOr', () => {
    assert.equal(Some(1).unwrapOr(2), 1);
    assert.equal(None().unwrapOr(2), 2);
  });
  it('should unwrap its value or call a function for unwrapOrElse', () => {
    assert.equal(Some(1).unwrapOrElse(() => 2), 1);
    assert.equal(None().unwrapOrElse(() => 2), 2);
  });
  it('should convert to Ok/Err', () => {
    assert.ok(Some(1).okOr('sad').isOk());
    assert.ok(None().okOr('sad').isErr());
  });
  it('.okOrElse', () => {
    assert.ok(Some(1).okOrElse(() => 'sad').isOk());
    assert.ok(None().okOrElse(() => 'sad').isErr());
  });
  it('Some should resolve a promise with .promiseOr', () => {
    return Some(1)
      .promiseOr()
      .then(v => v === 1 ? v :
        Promise.reject(new Error(`got '${v}', expected 1`)));
  });
  it('None should reject with .promiseOr', () => {
    return None()
      .promiseOr(1)
      .catch(e => e === 1 ? Promise.resolve(e) :
        Promise.reject(new Error(`got '${e}', expected 1`)));
  });
  it('Some should resolve a promise with .promiseOrElse', () => {
    return Some(1)
      .promiseOrElse()
      .then(v => v === 1 ? v :
        Promise.reject(new Error(`got '${v}', expected 1`)));
  });
  it('None should reject with .promiseOrElse', () => {
    return None()
      .promiseOrElse(() => 1)
      .catch(e => e === 1 ? Promise.resolve(e) :
        Promise.reject(new Error(`got '${e}', expected 1`)));
  });
  it('should never be the result of .and if Some', () => {
    assert.equal(Some(1).and(Some(2)).unwrap(), 2);
    assert.ok(None().and(Some(2)).isNone());
    assert.ok(Some(1).and(None()).isNone());
    assert.ok(None().and(None()).isNone());
  });
  it('.and should promote non-Maybe to Some', () => {
    assert.ok(Some(1).and(2).isSome());
    assert.equal(Some(1).and(2).unwrap(), 2);
  });
  it('should be used with andThen if Some', () => {
    assert.equal(Some(1).andThen((v) => Some(v*2)).unwrap(), 2);
    assert.ok(None().andThen((v) => Some(v*2)).isNone());

    assert.ok(Some(1).andThen((v) => None()).isNone());
    assert.ok(None().andThen((v) => None()).isNone());
  });
  it('.andThen should promote non-Maybe to Some', () => {
    assert.ok(Some(1).andThen(() => 2).isSome());
    assert.equal(Some(1).andThen(() => 2).unwrap(), 2);
  });
  it('.or', () => {
    assert.equal(Some(1).or(Some(2)).unwrap(), 1);
    assert.equal(None().or(Some(2)).unwrap(), 2);
    assert.equal(Some(1).or(None()).unwrap(), 1);
    assert.ok(None().or(None()).isNone());
  });
  it('.or should promote non-Maybe to Some', () => {
    assert.ok(None().or(1).isSome());
    assert.equal(None().or(1).unwrap(), 1);
  });
  it('.orElse', () => {
    assert.equal(Some(1).orElse(() => Some(2)).unwrap(), 1);
    assert.equal(None().orElse(() => Some(2)).unwrap(), 2);
    assert.equal(Some(1).orElse(() => None()).unwrap(), 1);
    assert.ok(None().orElse(() => None()).isNone());
  });
  it('.orElse should promote non-Maybe to Some', () => {
    assert.ok(None().orElse(() => 1).isSome());
    assert.equal(None().orElse(() => 1).unwrap(), 1);
  });
  it('.filter should none-ify false-y returns', () => {
    assert.ok(None().filter(x => true).isNone());
    assert.equal(Some(1).filter(x => true).unwrap(), 1);
    assert.ok(Some(1).filter(x => false).isNone());
  });
  it('.equals should work', () => {
    assert.ok(None().equals(None()));
    assert.ifError(None().equals(Some()));
    assert.ok(Some(1).equals(Some(1)));
    assert.ifError(Some(1).equals(Some(2)));
  });
  describe('Maybe.all', () => {
    it('should make an empty Some for an empty array', () => {
      var a = [];
      assert.ok(Maybe.all(a).isSome());
      assert.deepEqual(Maybe.all(a).unwrap(), []);
    });
    it('should pass through 1 Some in an array', () => {
      var ma = Maybe.all([Some(1)]);
      assert.ok(ma.isSome());
      assert.deepEqual(ma.unwrap(), [1]);
    });
    it('should pass through n Somes in an array and preserve order', () => {
      var ma2 = Maybe.all([Some(1), Some(2)]);
      assert.ok(ma2.isSome());
      assert.deepEqual(ma2.unwrap(), [1, 2]);
      assert.deepEqual(Maybe.all([Some(1), Some(2), Some(3)]).unwrap(), [1, 2, 3]);
    });
    it('should accept non-Maybe input as Some', () => {
      assert.ok(Maybe.all([0]).isSome());
      assert.deepEqual(Maybe.all([0]).unwrap(), [0]);
      assert.deepEqual(Maybe.all([0, Some(0)]).unwrap(), [0, 0]);
    });
    it('should be None if any inputs are None', () => {
      assert(Maybe.all([None()]).isNone());
      assert(Maybe.all([None(), None()]).isNone());
      assert(Maybe.all([Some(1), None()]).isNone());
      assert(Maybe.all([None(), Some(1)]).isNone());
      assert(Maybe.all([None(), 1]).isNone());
      assert(Maybe.all([1, None()]).isNone());
    });
    it('regression: should not flatten arrays', () => {
      assert.deepEqual(Maybe.all([[]]).unwrap(), [[]]);
      assert.deepEqual(Maybe.all([Some(1), Some([2])]).unwrap(), [1, [2]]);
    });
  });
  describe('Maybe.undefined', () => {
    it('Should wrap any non-undefined value in Some', () => {
      assert(Maybe.undefined(1).isSome());
      assert.equal(Maybe.undefined(1).unwrap(), 1);
      assert(Maybe.undefined(0).isSome());
      assert.equal(Maybe.undefined(0).unwrap(), 0);
      assert(Maybe.undefined(null).isSome());
    });
    it('Should return None() for undefined', () => {
      assert(Maybe.undefined(undefined).isNone());
      assert(Maybe.undefined().isNone());
    });
  });
  describe('Maybe.null', () => {
    it('Should wrap any non-null value in Some', () => {
      assert(Maybe.null(1).isSome());
      assert.equal(Maybe.null(1).unwrap(), 1);
      assert(Maybe.null(0).isSome());
      assert.equal(Maybe.null(0).unwrap(), 0);
      assert(Maybe.null().isSome());
    });
    it('Should return None() for null', () => {
      assert(Maybe.null(null).isNone());
    });
  });
  describe('Maybe.nan', () => {
    it('should wrap any non-nan in Some', () => {
      assert(Maybe.nan(1).isSome());
      assert.equal(Maybe.nan(1).unwrap(), 1);
      assert(Maybe.nan().isSome());
    });
    it('should return None() for nan', () => {
      assert(Maybe.nan(NaN).isNone());
    });
  });
});


describe('Result', () => {
  it('should map to Ok or Err callbacks', () => {
    assert.equal(Result.match(Ok(1), {Ok: (v) => v, Err: (e) => e}), 1);
    assert.equal(Result.match(Err(2), {Ok: (v) => v, Err: (e) => e}), 2);
  });
  it('should self-identify', () => {
    assert.ok(Ok(1).isOk());
    assert.ok(Err(2).isErr());
  });
  it('should should anti-self-other-identify', () => {
    assert.equal(Ok(1).isErr(), false);
    assert.equal(Err(2).isOk(), false);
  });
  it('.Ok should use a Result given to it', () => {
    assert.equal(Ok(Ok(1)).unwrap(), 1);
    assert.equal(Ok(Err(2)).isErr(), true);
  });
  it('.Err should not unwrap Results given to it', () => {
    assert.ok(Err(Ok(1)).unwrapErr().isOk());
    assert.ok(Err(Err(2)).unwrapErr().isErr());
  });
  it('should convert to an Option', () => {
    assert.ok(Ok(1).ok().isSome());
    assert.equal(Ok(1).ok().unwrap(), 1);
    assert.ok(Err(2).ok().isNone());
  });
  it('should convert to an Option with .err', () => {
    assert.ok(Ok(1).err().isNone());
    assert.ok(Err(2).err().isSome());
    assert.equal(Err(2).err().unwrap(), 2);
  });
  it('Ok should resolve a promise with .promise', () => {
    return Ok(1)
      .promise()
      .then(v => v === 1 ? v :
        Promise.reject(new Error(`got '${v}', expected 1`)));
  });
  it('Err should reject with .promise', () => {
    return Err(1)
      .promise()
      .catch(e => e === 1 ? Promise.resolve(e) :
        Promise.reject(new Error(`got '${e}', expected 1`)));
  });
  it('Ok should reject a promise with .promiseErr', () => {
    return Ok(1)
      .promiseErr()
      .catch(e => e === 1 ? Promise.resolve(e) :
        Promise.reject(new Error(`got '${e}', expected 1`)));
  });
  it('Err should resolve with .promiseErr', () => {
    return Err(1)
      .promiseErr()
      .then(v => v === 1 ? v :
        Promise.reject(new Error(`got '${v}', expected 1`)));
  });
  it('.expect', () => {
    assert.equal(Ok(1).expect(), 1);
    assert.throws(() => Err(1).expect(new Error('asdf')), Error);
  });
  it('.and', () => {
    assert.ok(Ok(1).and(Ok(-1)).isOk());
    assert.equal(Ok(1).and(Ok(-1)).unwrap(), -1);
    assert.ok(Err(2).and(Ok(-1)).isErr());
    assert.equal(Err(2).and(Ok(-1)).unwrapErr(), 2);
    assert.ok(Ok(1).and(Err(-2)).isErr());
    assert.equal(Ok(1).and(Err(-2)).unwrapErr(), -2);
    assert.ok(Err(2).and(Err(-2)).isErr());
    assert.equal(Err(2).and(Err(-2)).unwrapErr(), 2);
  });
  it('.and should promote non-Result to Ok', () => {
    assert.ok(Err(1).or(2).isOk());
    assert.equal(Err(1).or(2).unwrap(), 2);
  });
  it('.andThen', () => {
    var sq = (v) => Ok(v * v);
    assert.equal(Ok(-1).andThen(sq).unwrap(), 1);
    assert.ok(Err(2).andThen(sq).isErr());
  });
  it('.andThen should promote non-Result to Ok', () => {
    assert.ok(Ok(1).andThen(() => 2).isOk());
    assert.equal(Ok(1).andThen(() => 2).unwrap(), 2);
  });
  it('.or', () => {
    assert.ok(Ok(1).or(Ok(-1)).isOk());
    assert.equal(Ok(1).or(Ok(-1)).unwrap(), 1);
    assert.ok(Err(2).or(Ok(-1)).isOk());
    assert.equal(Err(2).or(Ok(-1)).unwrap(), -1);
    assert.ok(Ok(1).or(Err(-2)).isOk());
    assert.equal(Ok(1).or(Err(-2)).unwrap(), 1);
    assert.ok(Err(2).or(Err(-2)).isErr());
    assert.equal(Err(2).or(Err(-2)).unwrapErr(), -2);
  });
  it('.or should promote non-result to Ok', () => {
    assert.ok(Err(1).or(2).isOk());
    assert.equal(Err(1).or(2).unwrap(), 2);
  });
  it('.orElse', () => {
    var timesTwo = (n) => Ok(n*2);
    assert.equal(Ok(1).orElse(timesTwo).unwrap(), 1);
    assert.equal(Err(-2).orElse(timesTwo).unwrap(), -4);
  });
  it('.orElse should promote non-Result to Ok', () => {
    assert.ok(Err(1).orElse(() => 2).isOk());
    assert.equal(Err(1).orElse(() => 2).unwrap(), 2);
  });
  it('.unwrapOr', () => {
    assert.equal(Ok(1).unwrapOr(5), 1);
    assert.equal(Err(2).unwrapOr(5), 5);
  });
  it('.unwrapOrElse', () => {
    var timesTwo = (n) => n*2;
    assert.equal(Ok(1).unwrapOrElse(timesTwo), 1);
    assert.equal(Err(2).unwrapOrElse(timesTwo), 4);
  });
  it('.unwrap', () => {
    assert.equal(Ok(1).unwrap(), 1);
    try {
      Err(42).unwrap();
      assert.fail('should have thrown when unwrapping Err()');
    } catch (err) {
      assert.equal(err, 42);
    }
  });
  it('.unwrapErr', () => {
    assert.equal(Err(1).unwrapErr(), 1);
    assert.throws(() => Ok(1).unwrapErr());
  });
  it('.equals should work', () => {
    assert.ok(Ok(1).equals(Ok(1)));
    assert.ifError(Ok(1).equals(Ok(2)));
    assert.ok(Err(1).equals(Err(1)));
    assert.ifError(Err(1).equals(Err(2)));
    assert.ifError(Ok(1).equals(Err(1)));
  });

  describe('Result.all', () => {
    it('should make an empty Ok for an empty array', () => {
      var a = [];
      assert.ok(Result.all(a).isOk());
      assert.deepEqual(Result.all(a).unwrap(), []);
    });
    it('should pass through 1 Ok in an array', () => {
      var oa = Result.all([Ok(1)]);
      assert.ok(oa.isOk());
      assert.deepEqual(oa.unwrap(), [1]);
    });
    it('should pass through n Oks in an array and preserve order', () => {
      var oa2 = Result.all([Ok(1), Ok(2)]);
      assert.ok(oa2.isOk());
      assert.deepEqual(oa2.unwrap(), [1, 2]);
      assert.deepEqual(Result.all([Ok(1), Ok(2), Ok(3)]).unwrap(), [1, 2, 3]);
    });
    it('should accept non-Result input as Ok', () => {
      assert.ok(Result.all([0]).isOk());
      assert.deepEqual(Result.all([0]).unwrap(), [0]);
      assert.deepEqual(Result.all([0, Ok(0)]).unwrap(), [0, 0]);
    });
    it('should be the first Err if any inputs are Err', () => {
      assert(Result.all([Err()]).isErr());
      assert(Result.all([Err(9), Err(8)]).isErr());
      assert(Result.all([Ok(1), Err(9)]).isErr());
      assert(Result.all([Err(9), Ok(1)]).isErr());
      assert(Result.all([Err(9), 1]).isErr());
      assert(Result.all([1, Err(9)]).isErr());

      assert.equal(Result.all([Err(9), Err(8)]).unwrapErr(), 9);
      assert.equal(Result.all([0, Err(9)]).unwrapErr(), 9);
    });
    it('regression: should not flatten arrays', () => {
      assert.deepEqual(Result.all([[]]).unwrap(), [[]]);
      assert.deepEqual(Result.all([Ok(1), Ok([2])]).unwrap(), [1, [2]]);
    });
  });

  describe('Result.try', () => {
    it('should return a Some(retVal) for functions that don\'t throw', () => {
      const retVal = {};
      const res = Result.try(() => retVal);
      assert(res.isOk());
      assert(res.unwrap() === retVal);
    });
    it('should return a None(err) for functions that throw', () => {
      const err = new Error('an error');
      const thrower = () => { throw err; }
      assert(Result.try(thrower).isErr());
      assert(Result.try(thrower).unwrapErr() === err);
    });
  });
});

describe('compatibility', () => {
  describe('immutablejs', () => {
    it('should not be destroyed by Map or .fromJS', () => {
      const U = Union({A: null});
      const m = Immutable.Map({ a: U.A() });
      assert(m.get('a').equals(U.A()));
      const fjs = Immutable.fromJS({ a: U.A() });
      assert(fjs.get('a').equals(U.A()));
    });
    it('.equals should recurse into immutablejs structures', () => {
      const U = Union({A: null});
      const immuInUnion = U.A(Immutable.List([1]));

      assert.ok(immuInUnion.equals(U.A(Immutable.List([1]))), 'union .equals recurses into immutable .equals');
      assert.ifError(immuInUnion.equals(U.A(Immutable.List([2]))));
    });
    it('immutable .equals should recurse into results structures', () => {
      const U = Union({A: null});
      const unionInImmu = Immutable.List([U.A(1)]);

      assert.ok(unionInImmu.equals(Immutable.List([U.A(1)])));
      assert.ifError(unionInImmu.equals(Immutable.List([U.A(2)])));
    });
    it('regression: should pass .equals for date instances', () => {
      const U = Union({ A: null });
      const a = U.A(new Date('2016-01-01'));
      const b = U.A(new Date('2016-01-01'));
      assert.ok(a.equals(b));
    });
  });
});
