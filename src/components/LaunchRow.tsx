import Link from 'next/link';
import { localizedPath, type Locale } from '@/lib/locale';
import type { Launch } from '@/lib/types';
import { LocalTime } from './LocalTime';
import { SourceText } from './SourceText';
import { StatusTag } from './StatusTag';
import { Thumbnail } from './Thumbnail';
import styles from './LaunchRow.module.css';

/** One line in the Upcoming / Recent lists. The whole row links to the launch page. */
export function LaunchRow({ launch, locale }: { launch: Launch; locale: Locale }) {
  return (
    <li>
      <Link href={localizedPath(locale, `/launch/${launch.slug}/`)} className={styles.row}>
        <span className={styles.thumb}>
          <Thumbnail launch={launch} locale={locale} />
        </span>
        <span className={styles.text}>
          <b>
            <SourceText text={launch.name} locale={locale} />
          </b>
          <small>
            <SourceText text={launch.rocket.name} locale={locale} /> · {launch.provider.abbrev} ·{' '}
            <SourceText text={launch.pad.locationName} locale={locale} />
          </small>
        </span>
        <span className={styles.when}>
          <LocalTime iso={launch.net} precision={launch.netPrecision} locale={locale} />
        </span>
        <span className={styles.tag}>
          <StatusTag launch={launch} locale={locale} />
        </span>
      </Link>
    </li>
  );
}
