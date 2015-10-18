var assert = require('assert');
var { Union, Result, Ok, Err, Maybe, Some, None } = require('./index');


describe('Union', () => {
  it('should fail if options are missing', () => {
    assert.throws(() => Union(), Error);
  });
  it('should accept an object', () => {
    assert.equal(Union({A: null}).A().match({A: () => 42}), 42);
  });
  it('should.. work for empty object... I guess', () => {
    assert.ok(Union({}));
  });
  describe('.match', () => {
    it('should ensure that the match paths are exhaustive', () => {
      var myUnion = Union({A: 0, B: 0}).A();
      assert.throws(() => myUnion.match({a: () => 'whatever'}), Error);
    });
    it('should always be exhaustive with a wildcard match', () => {
      assert.equal(Union({A: 0, B: 0}).A().match({_: () => 42}), 42);
      assert.equal(Union({A: 0, B: 0}).B().match({_: () => 42}), 42);
    });
    it('should pass a value to `match` callbacks', () => {
      assert.equal(Union({A: 1}).A(42).match({A: (v) => v}), 42);
    });
    it('should pass all values to `match` callbacks', () => {
      assert.equal(Union({A: 2}).A(42, 41).match({A: (v, z) => z}), 41);
    });
    it('should pass itself to catch-all `match` callbacks', () => {
      assert.equal(Union({A: 1}).A(42).match({_: (en) => en.name}), 'A');
      assert.equal(Union({A: 1}).A(42).match({_: (en) => en.data[0]}), 42);
    });
    it('should throw for unrecognized keys', () => {
      var a = Union({A: 0, B: 1}).A();
      var f = () => null;
      assert.throws(() => a.match({A: f, B: f, C: f}), Error);
    });
  });
});


describe('Maybe', () => {
  it('should map to Some or None callbacks', () => {
    assert.equal(Some(1).match({Some: (v) => v, None: () => null}), 1);
    assert.equal(None().match({Some: () => null, None: () => 1}), 1);
  });
  it('should self-identify', () => {
    assert.ok(Some(1).isSome());
    assert.ok(None().isNone());
  });
  it('should other-anti-identify', () => {
    assert.equal(Some(1).isNone(), false);
    assert.equal(None().isSome(), false);
  });
  it('should throw or not for expect', () => {
    assert.doesNotThrow(() => {Some(1).expect('err')});
    assert.throws(() => {None().expect('err')}, 'err');
  });
  it('should unwrap or throw', () => {
    assert.equal(Some(1).unwrap(), 1);
    assert.throws(() => None().unwrap(), Error);
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
  it('should never be the result of .and if Some', () => {
    assert.equal(Some(1).and(Some(2)).unwrap(), 2);
    assert.ok(None().and(Some(2)).isNone());
    assert.ok(Some(1).and(None()).isNone());
    assert.ok(None().and(None()).isNone());
  });
  it('should be used with andThen if Some', () => {
    assert.equal(Some(1).andThen((v) => Some(v*2)).unwrap(), 2);
    assert.ok(None().andThen((v) => Some(v*2)).isNone());

    assert.ok(Some(1).andThen((v) => None()).isNone());
    assert.ok(None().andThen((v) => None()).isNone());
  });
  it('.or', () => {
    assert.equal(Some(1).or(Some(2)).unwrap(), 1);
    assert.equal(None().or(Some(2)).unwrap(), 2);
    assert.equal(Some(1).or(None()).unwrap(), 1);
    assert.ok(None().or(None()).isNone());
  });
  it('.orElse', () => {
    assert.equal(Some(1).orElse(() => Some(2)).unwrap(), 1);
    assert.equal(None().orElse(() => Some(2)).unwrap(), 2);
    assert.equal(Some(1).orElse(() => None()).unwrap(), 1);
    assert.ok(None().orElse(() => None()).isNone());
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
    it('should be None if any inputs are None', () => {
      assert(Maybe.all([None()]).isNone());
      assert(Maybe.all([None(), None()]).isNone());
      assert(Maybe.all([Some(1), None()]).isNone());
      assert(Maybe.all([None(), Some(1)]).isNone());
    });
  });
});


describe('Result', () => {
  it('should map to Ok or Err callbacks', () => {
    assert.equal(Ok(1).match({Ok: (v) => v, Err: (e) => e}), 1);
    assert.equal(Err(2).match({Ok: (v) => v, Err: (e) => e}), 2);
  });
  it('should self-identify', () => {
    assert.ok(Ok(1).isOk());
    assert.ok(Err(2).isErr());
  });
  it('should should anti-self-other-identify', () => {
    assert.equal(Ok(1).isErr(), false);
    assert.equal(Err(2).isOk(), false);
  });
  it('should convert to an Option', () => {
    assert.ok(Ok(1).ok().isSome());
    assert.equal(Ok(1).ok().unwrap(), 1);
    assert.ok(Err(2).ok().isNone());
  });
  it('should convert to an Option<E>', () => {
    assert.ok(Ok(1).err().isNone());
    assert.ok(Err(2).err().isSome());
    assert.equal(Err(2).err().unwrap(), 2);
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
  it('.andThen', () => {
    var sq = (v) => Ok(v * v);
    assert.equal(Ok(-1).andThen(sq).unwrap(), 1);
    assert.ok(Err(2).andThen(sq).isErr());
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
  it('.orElse', () => {
    var timesTwo = (n) => Ok(n*2);
    assert.equal(Ok(1).orElse(timesTwo).unwrap(), 1);
    assert.equal(Err(-2).orElse(timesTwo).unwrap(), -4);
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
    assert.throws(() => Err(2).unwrap());
    var answer;
    try {
      Err(2).unwrap();
    } catch (err) {
      answer = err.match({
        UnwrapErr: () => 'the right answer',
        _: (what) => 'the wrong answer: ' + what,
      });
      assert.equal(answer, 'the right answer');
    }
  });
  it('.unwrapErr', () => {
    assert.throws(() => Ok(1).unwrapErr());
    var answer;
    try {
      Ok(1).unwrapErr();
    } catch (err) {
      answer = err.match({
        UnwrapErrAsOk: () => 'the right answer',
        _: (what) => 'the wrong answer: ' + what,
      });
      assert.equal(answer, 'the right answer');
    }
    assert.equal(Err(2).unwrapErr(), 2);
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
    it('should be the first Err if any inputs are Err', () => {
      assert(Result.all([Err()]).isErr());
      assert(Result.all([Err(9), Err(8)]).isErr());
      assert(Result.all([Ok(1), Err(9)]).isErr());
      assert(Result.all([Err(9), Ok(1)]).isErr());

      assert.equal(Result.all([Err(9), Err(8)]).unwrapErr(), 9);
    });
  });
});
