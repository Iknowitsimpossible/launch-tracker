import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { buildIcs } from '../src/lib/ics';
import { makeLaunch } from './fixtures';

const NOW = new Date('2026-11-17T12:00:00Z');

/** Undo line folding (CRLF + space) and split into logical lines. */
function unfold(ics: string): string[] {
  return ics.replace(/\r\n /g, '').split('\r\n').filter(Boolean);
}

function field(ics: string, name: string): string | undefined {
  return unfold(ics).find((line) => line.startsWith(`${name}:`) || line.startsWith(`${name};`));
}

describe('buildIcs', () => {
  test('an exact time runs from liftoff to the end of the window', () => {
    const ics = buildIcs(makeLaunch(), NOW);
    assert.equal(field(ics, 'DTSTART'), 'DTSTART:20261118T031400Z');
    assert.equal(field(ics, 'DTEND'), 'DTEND:20261118T050000Z');
    assert.equal(field(ics, 'DTSTAMP'), 'DTSTAMP:20261117T120000Z');
  });

  test('without a window end the event lasts one hour', () => {
    const ics = buildIcs(makeLaunch({ windowEnd: null }), NOW);
    assert.equal(field(ics, 'DTEND'), 'DTEND:20261118T041400Z');
  });

  test('a window end before liftoff is ignored', () => {
    const ics = buildIcs(makeLaunch({ windowEnd: '2026-11-18T01:00:00Z' }), NOW);
    assert.equal(field(ics, 'DTEND'), 'DTEND:20261118T041400Z');
  });

  test('a day-only launch is an all-day event', () => {
    const ics = buildIcs(makeLaunch({ net: '2026-11-18T00:00:00Z', netPrecision: 'day' }), NOW);
    assert.equal(field(ics, 'DTSTART'), 'DTSTART;VALUE=DATE:20261118');
    assert.equal(field(ics, 'DTEND'), 'DTEND;VALUE=DATE:20261119');
  });

  test('escapes the characters the format reserves', () => {
    const ics = buildIcs(makeLaunch({ name: 'Starlink; Group 6, Part\\2' }), NOW);
    assert.equal(field(ics, 'SUMMARY'), 'SUMMARY:Launch: Starlink\\; Group 6\\, Part\\\\2 (Falcon 9 Block 5)');
  });

  test('uses CRLF line endings and keeps every line within 75 bytes', () => {
    const longName = '一颗很长名字的卫星'.repeat(10);
    const ics = buildIcs(makeLaunch({ name: longName }), NOW, 'zh-Hans');
    assert.ok(ics.endsWith('\r\n'));
    assert.ok(!/[^\r]\n/.test(ics), 'found a bare LF');
    for (const line of ics.split('\r\n')) {
      assert.ok(Buffer.byteLength(line) <= 75, `line too long: ${Buffer.byteLength(line)} bytes`);
    }
    // Folding must not lose or corrupt any characters.
    assert.ok(field(ics, 'SUMMARY')?.includes(longName));
  });

  test('only links a real web address as the stream', () => {
    const unsafe = buildIcs(makeLaunch({ webcasts: [{ title: 'x', url: 'javascript:alert(1)', source: null }] }), NOW);
    assert.ok(!field(unsafe, 'DESCRIPTION')?.includes('Watch'));

    const safe = buildIcs(makeLaunch({ webcasts: [{ title: 'x', url: 'https://youtu.be/abc', source: null }] }), NOW);
    assert.ok(field(safe, 'DESCRIPTION')?.includes('Watch: https://youtu.be/abc'));
  });
});
