import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        {SITE_NAME}
      </Link>
      <nav aria-label="Sections" className={styles.nav}>
        <Link href="/#upcoming">Upcoming</Link>
        <Link href="/#recent">Recent</Link>
      </nav>
    </header>
  );
}
