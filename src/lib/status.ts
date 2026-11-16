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

/** The words on the tag. "Date not set" beats the status when only the month is known. */
export function statusText(launch: Launch): string {
  if (launch.netPrecision === 'approximate') return 'Date not set';
  if (launch.status === 'in_flight') return 'In flight';
  return launch.statusLabel;
}
