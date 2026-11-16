import type { Locale } from '@/lib/locale';
import { firstChineseSentences, firstSentences } from '@/lib/text';
import { localizeText } from '@/lib/translate';
import type { Launch } from '@/lib/types';
import { MissionPlates } from './MissionPlates';
import { Panel } from './Panel';
import styles from './MissionSection.module.css';
import sourceStyles from './SourceText.module.css';

export function MissionSection({ launch, locale }: { launch: Launch; locale: Locale }) {
  const description = launch.mission.description;
  // The full description can be long, so the page shows only a short lead.
  // The whole description is translated, then shortened in its own language.
  const localized = description ? localizeText(description, locale) : null;
  const lead = !localized
    ? ''
    : localized.lang === 'zh-Hans'
      ? firstChineseSentences(localized.text, 2)
      : firstSentences(localized.text, 2);

  return (
    <Panel title={locale === 'zh-Hans' ? '任务概况' : 'Mission'}>
      {lead && localized && (
        <p className={styles.lead} lang={localized.lang}>
          {lead}
          {localized.isOriginal && <span className={sourceStyles.original}>原文</span>}
        </p>
      )}
      <MissionPlates launch={launch} locale={locale} />
    </Panel>
  );
}
