var assert = require('assert');
var {Ok, Err, Some, None, errors} = require('./index');


describe('Option', () => {
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
    assert.throws(() => {None().unwrap()});
  });
  it('should unwrap its value or a default for unwrapOr', () => {
    assert.equal(Some(1).unwrapOr(2), 1);
    assert.equal(None().unwrapOr(2), 2);
  });
  it('should unwrap its value or call a function for unwrapOrElse', () => {
    assert.equal(Some(1).unwrapOrElse(() => 2), 1);
    assert.equal(None().unwrapOrElse(() => 2), 2);
  });
  it('.map', () => {
    assert.equal(Some(2).map((v) => v/2).unwrap(), 1);
    assert.ok(None().map((v) => v/2).isNone());
  });
  it('.mapOr', () => {
    assert.equal(Some(2).mapOr(0, (v) => v/2), 1);
    assert.equal(None().mapOr(0, (v) => v/2), 0);
  });
  it('.mapOrElse', () => {
    assert.equal(Some(2).mapOrElse(() => 0, (v) => v/2), 1);
    assert.equal(None().mapOrElse(() => 0, (v) => v/2), 0);
  });
  it('should convert to Ok/Err', () => {
    assert.ok(Some(1).okOr('sad').isOk());
    assert.ok(None().okOr('sad').isErr());
  });
  it('.okOrElse', () => {
    assert.ok(Some(1).okOrElse(() => 'sad').isOk());
    assert.ok(None().okOrElse(() => 'sad').isErr());
  });
  it('should go into an array', () => {
    assert.equal(Some(1).array().length, 1);
    assert.equal(None().array().length, 0);

    assert.equal(Some(1).array()[0], 1);
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
    assert.equal(None(1).or(Some(2)).unwrap(), 2);
    assert.equal(Some(1).or(None()).unwrap(), 1);
    assert.ok(None().or(None()).isNone());
  });
  it('.orElse', () => {
    assert.equal(Some(1).orElse(() => Some(2)).unwrap(), 1);
    assert.equal(None().orElse(() => Some(2)).unwrap(), 2);
    assert.equal(Some(1).orElse(() => None()).unwrap(), 1);
    assert.ok(None().orElse(() => None()).isNone());
  });
  it('should mutate after returning a copy of itself on .take', () => {
    var s = Some(1);
    var t = s.take();
    assert.ok(s.isNone());
    assert.equal(t.unwrap(), 1);

    var n = None();
    var o = n.take();
    assert.ok(n.isNone());
    assert.ok(o.isNone());
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
  it('.map', () => {
    assert.equal(Ok(1).map((v) => v + 5).unwrapOr(0), 6);
    assert.equal(Err(2).map((v) => v + 1).unwrapOr(0), 0);
  });
  it('.mapErr', () => {
    assert.equal(Ok(1).mapErr((v) => v + 5).unwrapOr(0), 1);
    assert.equal(Err(2).mapErr((v) => v + 5).unwrapErr(), 7);
  });
  it('.array', () => {
    assert.equal(Ok(1).array().length, 1);
    assert.equal(Err(2).array().length, 0);
    assert.equal(Ok(1).array()[0], 1);
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
  });
  it('.unwrapErr', () => {
    assert.throws(() => Ok(1).unwrapErr());
    assert.equal(Err(2).unwrapErr(), 2);
  });
});
