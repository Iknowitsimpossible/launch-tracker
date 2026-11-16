import type { Locale } from './locale';
import type { Launch, LaunchStatus } from './types';

/** How a status tag should look. The CSS in StatusTag.module.css has one style per tone. */
export type StatusTone = 'confirmed' | 'uncertain' | 'failure' | 'partial';

/** The launch is over and its result is known. */
export function isFinished(status: LaunchStatus): boolean {
  return status === 'success' || status === 'failure' || status === 'partial_failure';
}

/** The rocket has left the pad (flying or finished), so countdown and weather no longer apply. */
export function hasLiftedOff(status: LaunchStatus): boolean {
  return status === 'in_flight' || isFinished(status);
}

export function statusTone(launch: Launch): StatusTone {
  if (launch.netPrecision === 'approximate') return 'uncertain';
  switch (launch.status) {
    case 'go':
    case 'success':
    case 'in_flight':
      return 'confirmed';
    case 'failure':
      return 'failure';
    case 'partial_failure':
      return 'partial';
    default:
      return 'uncertain'; // tbc, tbd, hold
  }
}

const CHINESE_STATUS: Record<LaunchStatus, string> = {
  go: '发射时间已确认',
  tbc: '有待确认',
  tbd: '时间待定',
  hold: '发射暂停',
  in_flight: '飞行中',
  success: '发射成功',
  partial_failure: '发射部分失败',
  failure: '发射失败',
};

/** The tag shows date uncertainty first. The outcome shows the actual flight status. */
export function statusText(
  launch: Launch,
  locale: Locale,
  { showDatePrecision = true } = {},
): string {
  if (showDatePrecision && launch.netPrecision === 'approximate') {
    return locale === 'zh-Hans' ? '日期待定' : 'Date not set';
  }
  if (locale === 'zh-Hans') return CHINESE_STATUS[launch.status];
  if (launch.status === 'in_flight') return 'In flight';
  return launch.statusLabel;
}
