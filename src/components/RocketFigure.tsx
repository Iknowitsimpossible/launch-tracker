import type { Launch } from '@/lib/types';

/**
 * The rocket section's figure: an outline of the rocket with a height marker,
 * big numbers with everyday comparisons, and the booster's flight markers.
 *
 * STUB: the drawings agent replaces the body. The props are fixed.
 */
export function RocketFigure({ launch }: { launch: Launch }) {
  return <div data-stub="rocket-figure">{launch.rocket.fullName}</div>;
}
