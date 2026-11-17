import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { compareHeight, compareMass, compareThrust, friendlyRound, ordinal, plural } from '../src/lib/comparisons';

describe('friendlyRound', () => {
  test('never rounds down to zero', () => assert.equal(friendlyRound(0.8), 1));
  test('keeps small counts exact', () => assert.equal(friendlyRound(7.4), 7));
  test('snaps tens to fives', () => assert.equal(friendlyRound(63), 65));
  test('snaps hundreds to tens', () => assert.equal(friendlyRound(123), 120));
});

describe('ordinal', () => {
  test('spells out the first flight', () => assert.equal(ordinal(1), 'first'));
  test('uses st/nd/rd', () => {
    assert.equal(ordinal(2), '2nd');
    assert.equal(ordinal(3), '3rd');
    assert.equal(ordinal(21), '21st');
  });
  test('handles the teens', () => {
    assert.equal(ordinal(11), '11th');
    assert.equal(ordinal(13), '13th');
    assert.equal(ordinal(112), '112th');
  });
});

describe('plural', () => {
  test('singular for one', () => assert.equal(plural(1, 'launch', 'launches'), '1 launch'));
  test('adds thousands separators', () => assert.equal(plural(1234, 'launch', 'launches'), '1,234 launches'));
});

describe('compareHeight', () => {
  test('tall rockets become buildings', () => assert.equal(compareHeight(70), 'about a 20-storey building'));
  test('uses "an" before eight', () => assert.equal(compareHeight(28), 'about an 8-storey building'));
  test('short rockets become people', () => assert.equal(compareHeight(4), 'about 2 people stacked'));
  test('Chinese wording', () => assert.equal(compareHeight(70, 'zh-Hans'), '约 20 层楼高'));
  test('missing or nonsense values give null', () => {
    assert.equal(compareHeight(null), null);
    assert.equal(compareHeight(0), null);
    assert.equal(compareHeight(Number.NaN), null);
  });
});

describe('compareThrust', () => {
  test('Falcon 9 is about 7 jumbo jets', () => assert.equal(compareThrust(7607), 'roughly 7 jumbo jets'));
  test('steps down the ladder for small rockets', () => assert.equal(compareThrust(224), 'about a Boeing 737'));
  test('below the last rung says so', () => assert.equal(compareThrust(10), 'less than a small business jet'));
});

describe('compareMass', () => {
  test('Falcon 9 payload is about 4 elephants', () => assert.equal(compareMass(22800), 'about 4 elephants'));
  test('small payloads use people', () => assert.equal(compareMass(300), 'about 4 adults'));
  test('Chinese wording', () => assert.equal(compareMass(22800, 'zh-Hans'), '约相当于 4 头大象'));
});
