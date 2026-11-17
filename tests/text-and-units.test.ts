import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { degreesToCompass } from '../src/lib/compass';
import { isHttpUrl } from '../src/lib/links';
import { firstChineseSentences, firstSentences } from '../src/lib/text';

describe('degreesToCompass', () => {
  test('main points', () => {
    assert.equal(degreesToCompass(0), 'N');
    assert.equal(degreesToCompass(90), 'E');
    assert.equal(degreesToCompass(321), 'NW');
  });
  test('wraps negative and full-circle values', () => {
    assert.equal(degreesToCompass(-90), 'W');
    assert.equal(degreesToCompass(360), 'N');
    assert.equal(degreesToCompass(350), 'N');
  });
  test('Chinese points', () => assert.equal(degreesToCompass(90, 'zh-Hans'), '东'));
});

describe('isHttpUrl', () => {
  test('accepts web addresses', () => {
    assert.equal(isHttpUrl('https://www.youtube.com/watch?v=x'), true);
    assert.equal(isHttpUrl('http://example.com'), true);
  });
  test('rejects script and junk addresses', () => {
    assert.equal(isHttpUrl('javascript:alert(1)'), false);
    assert.equal(isHttpUrl('data:text/html,hi'), false);
    assert.equal(isHttpUrl('not a url'), false);
  });
});

describe('firstSentences', () => {
  test('does not split on initials like U.S.', () => {
    const text = 'The U.S. Space Force launched it. It went well. A third sentence.';
    assert.equal(firstSentences(text, 2), 'The U.S. Space Force launched it. It went well.');
  });
  test('returns everything when asked for more than there is', () => {
    assert.equal(firstSentences('Only one.', 3), 'Only one.');
  });
});

describe('firstChineseSentences', () => {
  test('splits on Chinese punctuation', () => {
    assert.equal(firstChineseSentences('第一句。第二句！第三句？', 2), '第一句。第二句！');
  });
});
