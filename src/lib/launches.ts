import launchJson from '../../data/launches.json';
import type { Launch, LaunchData } from './types';

/**
 * The data file is written by the scheduled fetch job. We import it at build
 * time, so the final site contains no code that loads data while it runs.
 */
export const launchData = launchJson as LaunchData;

/** Every launch once, upcoming first. If a slug appears twice, the first one wins. */
export function getAllLaunches(): Launch[] {
  const bySlug = new Map<string, Launch>();
  for (const launch of [...launchData.upcoming, ...launchData.recent]) {
    if (!bySlug.has(launch.slug)) bySlug.set(launch.slug, launch);
  }
  return [...bySlug.values()];
}

export function getLaunchBySlug(slug: string): Launch | undefined {
  return getAllLaunches().find((launch) => launch.slug === slug);
}

/** The soonest upcoming launch, or undefined when the list is empty. */
export function getNextLaunch(): Launch | undefined {
  return launchData.upcoming[0];
}
