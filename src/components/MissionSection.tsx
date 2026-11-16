import type { Locale } from '@/lib/locale';
import { firstSentences } from '@/lib/text';
import type { Launch } from '@/lib/types';
import { MissionPlates } from './MissionPlates';
import { Panel } from './Panel';
import styles from './MissionSection.module.css';

export function MissionSection({ launch, locale }: { launch: Launch; locale: Locale }) {
  const description = launch.mission.description;
  // The full description can be long, so the page shows only a short lead.
  const lead = description ? firstSentences(description, 2) : '';

  return (
    <Panel title={locale === 'zh-Hans' ? '任务概况' : 'Mission'}>
      {lead && <p className={styles.lead} lang="en">{lead}</p>}
      <MissionPlates launch={launch} locale={locale} />
    </Panel>
  );
}
