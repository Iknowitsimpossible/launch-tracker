const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** 0 degrees = N, 90 = E, 321 = NW. Each point covers a 45 degree slice. */
export function degreesToCompass(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360; // keeps negatives and 360+ in range
  return POINTS[Math.round(normalized / 45) % 8];
}
