import type { Locale } from '@/lib/locale';
import { statusText } from '@/lib/status';
import type { Launch } from '@/lib/types';
import { SourceText } from './SourceText';
import styles from './Outcome.module.css';

/** Takes the place of the countdown once the rocket has left the pad. */
export function Outcome({ launch, locale }: { launch: Launch; locale: Locale }) {
  const failed = launch.status === 'failure' || launch.status === 'partial_failure';
  const text = statusText(launch, locale, { showDatePrecision: false });

  return (
    <div className={`${styles.outcome} ${failed ? styles.failed : ''}`}>
      <p className={styles.result}>{text}</p>
      {launch.failReason && (
        <p className={styles.reason}>
          <SourceText text={launch.failReason} locale={locale} kind="prose" />
        </p>
      )}
    </div>
  );
}
