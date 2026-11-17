import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { formatLaunchTime } from '../src/lib/formatTime';
import { hasLiftedOff, isFinished, statusText, statusTone } from '../src/lib/status';
import { makeLaunch } from './fixtures';

describe('isFinished / hasLiftedOff', () => {
  test('a launch on the pad has neither', () => {
    assert.equal(isFinished('go'), false);
    assert.equal(hasLiftedOff('hold'), false);
  });
  test('in flight has lifted off but is not finished', () => {
    assert.equal(isFinished('in_flight'), false);
    assert.equal(hasLiftedOff('in_flight'), true);
  });
  test('every outcome is finished', () => {
    for (const status of ['success', 'failure', 'partial_failure'] as const) {
      assert.equal(isFinished(status), true, status);
    }
  });
});

describe('statusTone', () => {
  test('a rough date is always uncertain, whatever the status', () => {
    assert.equal(statusTone(makeLaunch({ status: 'go', netPrecision: 'approximate' })), 'uncertain');
  });
  test('outcomes have their own tones', () => {
    assert.equal(statusTone(makeLaunch({ status: 'success' })), 'confirmed');
    assert.equal(statusTone(makeLaunch({ status: 'failure' })), 'failure');
    assert.equal(statusTone(makeLaunch({ status: 'partial_failure' })), 'partial');
  });
  test('unconfirmed statuses are uncertain', () => {
    assert.equal(statusTone(makeLaunch({ status: 'hold' })), 'uncertain');
    assert.equal(statusTone(makeLaunch({ status: 'tbc' })), 'uncertain');
  });
});

describe('statusText', () => {
  test('a rough date says so first', () => {
    const launch = makeLaunch({ netPrecision: 'approximate' });
    assert.equal(statusText(launch, 'en'), 'Date not set');
    assert.equal(statusText(launch, 'en', { showDatePrecision: false }), 'Go for Launch');
  });
  test('uses the published label in English', () => {
    assert.equal(statusText(makeLaunch(), 'en'), 'Go for Launch');
    assert.equal(statusText(makeLaunch({ status: 'in_flight', statusLabel: 'Launch in Flight' }), 'en'), 'In flight');
  });
  test('uses fixed wording in Chinese', () => {
    assert.equal(statusText(makeLaunch(), 'zh-Hans'), '发射时间已确认');
  });
});

describe('formatLaunchTime', () => {
  test('a rough date shows only month and year', () => {
    assert.equal(formatLaunchTime('2026-12-01T00:00:00Z', 'approximate', { withZone: false }), 'December 2026');
  });
  test('a known day shows the UTC date, never shifted by time zone', () => {
    assert.equal(formatLaunchTime('2026-12-01T00:00:00Z', 'day', { withZone: false }), 'Tue, Dec 1, 2026');
  });
  test('the pre-rendered placeholder is in UTC and says so', () => {
    const text = formatLaunchTime('2026-11-18T03:14:00Z', 'exact', { withZone: false, fixed: true });
    assert.match(text, /Nov 18/);
    assert.match(text, /3:14/);
    assert.match(text, /UTC/);
  });
  test('a broken date does not crash', () => {
    assert.equal(formatLaunchTime('garbage', 'exact', { withZone: false }), 'Date unknown');
    assert.equal(formatLaunchTime('garbage', 'exact', { withZone: false, locale: 'zh-Hans' }), '日期未知');
  });
});
