import type { Launch } from '@/lib/types';
import { Panel } from './Panel';
import { RocketFigure } from './RocketFigure';

export function RocketSection({ launch }: { launch: Launch }) {
  return (
    <Panel title="The rocket">
      <RocketFigure launch={launch} />
    </Panel>
  );
}
