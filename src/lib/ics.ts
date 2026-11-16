import { isHttpUrl } from './links';
import type { Locale } from './locale';
import type { Launch } from './types';

const LINE_END = '\r\n'; // the calendar format requires CRLF

/** "2026-11-18T03:14:00Z" -> "20261118T031400Z" */
function toIcsDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** "2026-11-18" -> "20261118" (for all-day events) */
function toIcsDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/** Characters with special meaning in the format must be escaped. */
function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Lines may not be longer than 75 bytes; longer ones continue on a new line that starts with a space. */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // continuation lines lose one byte to the leading space
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join(LINE_END + ' ');
}

/**
 * Build the text of an .ics calendar file for one launch.
 * - exact time: an event from liftoff to the end of the window (1 hour if unknown).
 * - day only: an all-day event.
 * Not meant for 'approximate' launches (there is no date to put in a calendar).
 */
export function buildIcs(launch: Launch, now: Date = new Date(), locale: Locale = 'en'): string {
  const chinese = locale === 'zh-Hans';
  const start = new Date(launch.net);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Launch tracker//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT'];

  lines.push(`UID:${launch.id}@launch-tracker`);
  lines.push(`DTSTAMP:${toIcsDateTime(now)}`);

  if (launch.netPrecision === 'exact') {
    const windowEnd = launch.windowEnd ? new Date(launch.windowEnd) : null;
    const hasLaterEnd = windowEnd !== null && windowEnd.getTime() > start.getTime();
    const end = hasLaterEnd ? windowEnd : new Date(start.getTime() + 60 * 60 * 1000);
    lines.push(`DTSTART:${toIcsDateTime(start)}`);
    lines.push(`DTEND:${toIcsDateTime(end)}`);
  } else {
    const nextDay = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    lines.push(`DTSTART;VALUE=DATE:${toIcsDate(start)}`);
    lines.push(`DTEND;VALUE=DATE:${toIcsDate(nextDay)}`);
  }

  lines.push(`SUMMARY:${escapeText(`${chinese ? '发射任务：' : 'Launch: '}${launch.name} (${launch.rocket.fullName})`)}`);
  lines.push(`LOCATION:${escapeText(`${launch.pad.name}, ${launch.pad.locationName}`)}`);

  const description = [chinese
    ? `${launch.provider.name} 使用 ${launch.rocket.fullName} 执行发射任务。`
    : `${launch.rocket.fullName} by ${launch.provider.name}.`];
  const webcast = launch.webcasts.find((link) => isHttpUrl(link.url));
  if (webcast) description.push(`${chinese ? '观看：' : 'Watch: '}${webcast.url}`);
  lines.push(`DESCRIPTION:${escapeText(description.join('\n'))}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(foldLine).join(LINE_END) + LINE_END;
}
