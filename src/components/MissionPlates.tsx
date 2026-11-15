import type { Launch } from '@/lib/types';

/**
 * The row of small line drawings in the Mission section:
 * destination, crew, payload and landing.
 *
 * STUB: the drawings agent replaces the body. The props are fixed.
 */
export function MissionPlates({ launch }: { launch: Launch }) {
  return <div data-stub="mission-plates">{launch.mission.orbit?.name ?? 'Destination unknown'}</div>;
}
