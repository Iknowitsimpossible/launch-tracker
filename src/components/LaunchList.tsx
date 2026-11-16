import type { Locale } from '@/lib/locale';
import type { Launch } from '@/lib/types';
import { LaunchRow } from './LaunchRow';
import styles from './LaunchList.module.css';

interface LaunchListProps {
  /** Also the anchor the header nav links to. */
  id: string;
  locale: Locale;
  title: string;
  launches: Launch[];
  emptyMessage: string;
}

export function LaunchList({ id, title, launches, emptyMessage, locale }: LaunchListProps) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.title}>
        {title}
      </h2>
      {launches.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ul className={styles.list}>
          {launches.map((launch) => (
            <LaunchRow key={launch.slug} launch={launch} locale={locale} />
          ))}
        </ul>
      )}
    </section>
  );
}
