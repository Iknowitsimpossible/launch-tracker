import type { Locale } from '@/lib/locale';
import type { Launch } from '@/lib/types';
import { Panel } from './Panel';
import { RocketFigure } from './RocketFigure';

export function RocketSection({ launch, locale }: { launch: Launch; locale: Locale }) {
  return (
    <Panel title={locale === 'zh-Hans' ? '运载火箭' : 'The rocket'}>
      <RocketFigure launch={launch} locale={locale} />
    </Panel>
  );
}
