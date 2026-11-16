'use client';

import type { Locale } from '@/lib/locale';
import { useIsClient } from '@/lib/clientTime';
import { formatLaunchTime } from '@/lib/formatTime';
import type { Launch } from '@/lib/types';

interface LocalTimeProps {
  /** UTC time from the data file. */
  iso: string;
  locale: Locale;
  precision?: Launch['netPrecision'];
  /** Add the zone abbreviation (e.g. "PST") after the time. */
  showZone?: boolean;
}

/**
 * A time shown in the visitor's own time zone.
 * Before the browser takes over (pre-rendering and hydration) it shows the same
 * moment in UTC, labelled "UTC", so the server and browser HTML always match
 * and the placeholder displays an accurate time.
 */
export function LocalTime({ iso, locale, precision = 'exact', showZone = false }: LocalTimeProps) {
  const isClient = useIsClient();
  const text = formatLaunchTime(iso, precision, { withZone: showZone, fixed: !isClient, locale });
  return <time dateTime={iso}>{text}</time>;
}
