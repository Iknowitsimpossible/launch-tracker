import Link from 'next/link';
import { localizedPath, type Locale } from '@/lib/locale';
import type { Launch } from '@/lib/types';
import { LocalTime } from './LocalTime';
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
          <b>{launch.name}</b>
          <small>
            {launch.rocket.name} · {launch.provider.abbrev} · {launch.pad.locationName}
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
