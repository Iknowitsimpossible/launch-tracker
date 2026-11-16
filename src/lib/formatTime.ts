import type { Locale } from './locale';
import type { Launch } from './types';

interface FormatOptions {
  /** Add the zone abbreviation, e.g. "PST". */
  withZone: boolean;
  /** Use UTC for the placeholder shown before the browser takes over. */
  fixed?: boolean;
  locale?: Locale;
}

/**
 * Format a UTC time for display.
 * - exact: date and time in the visitor's own zone.
 * - day: only the date. The data stores midnight UTC, so converting to the
 *   visitor's zone would shift it to the wrong day; we print the UTC date as is.
 * - approximate: month and year only (same UTC reasoning).
 */
export function formatLaunchTime(iso: string, precision: Launch['netPrecision'], options: FormatOptions): string {
  const date = new Date(iso);
  const chinese = options.locale === 'zh-Hans';
  if (Number.isNaN(date.getTime())) return chinese ? '日期未知' : 'Date unknown';

  const locale = chinese ? 'zh-Hans' : 'en-US';

  if (precision === 'approximate') {
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  if (precision === 'day') {
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }
  return date.toLocaleString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: options.fixed ? 'UTC' : undefined,
    timeZoneName: options.withZone || options.fixed ? 'short' : undefined,
  });
}
