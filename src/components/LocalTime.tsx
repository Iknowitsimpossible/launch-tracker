'use client';

import { useIsClient } from '@/lib/clientTime';
import { formatLaunchTime } from '@/lib/formatTime';
import type { Launch } from '@/lib/types';

interface LocalTimeProps {
  /** UTC time from the data file. */
  iso: string;
  precision?: Launch['netPrecision'];
  /** Add the zone abbreviation (e.g. "PST") after the time. */
  showZone?: boolean;
}

/**
 * A time shown in the visitor's own time zone.
 * Before the browser takes over (pre-rendering and hydration) it shows the same
 * moment in UTC, labelled "UTC", so the server and browser HTML always match
 * and the placeholder is still correct, just not local.
 */
export function LocalTime({ iso, precision = 'exact', showZone = false }: LocalTimeProps) {
  const isClient = useIsClient();
  const text = formatLaunchTime(iso, precision, { withZone: showZone, fixed: !isClient });
  return <time dateTime={iso}>{text}</time>;
}
