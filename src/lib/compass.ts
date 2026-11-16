import type { Locale } from './locale';

const CHINESE_POINTS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** 0 degrees = N, 90 = E, 321 = NW. Each point covers a 45 degree slice. */
export function degreesToCompass(degrees: number, locale: Locale = 'en'): string {
  const normalized = ((degrees % 360) + 360) % 360; // keeps negatives and 360+ in range
  const points = locale === 'zh-Hans' ? CHINESE_POINTS : POINTS;
  return points[Math.round(normalized / 45) % 8];
}
