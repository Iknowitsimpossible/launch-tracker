import Link from 'next/link';
import { localizedPath, type Locale } from '@/lib/locale';
import { SITE_NAME } from '@/lib/site';
import styles from './SiteHeader.module.css';

export function SiteHeader({ locale, path }: { locale: Locale; path: string }) {
  const chinese = locale === 'zh-Hans';
  const otherLocale = chinese ? 'en' : 'zh-Hans';
  const home = localizedPath(locale, '/');

  return (
    <header className={styles.header}>
      <Link href={home} className={styles.brand} lang="en">
        {SITE_NAME}
      </Link>
      <nav aria-label={chinese ? '网站导航' : 'Sections'} className={styles.nav}>
        <Link href={`${home}#upcoming`}>{chinese ? '即将发射' : 'Upcoming'}</Link>
        <Link href={`${home}#recent`}>{chinese ? '近期发射' : 'Recent'}</Link>
        <Link href={localizedPath(otherLocale, path)} lang={otherLocale} hrefLang={otherLocale} className={styles.language}>
          {chinese ? 'English' : '中文'}
        </Link>
      </nav>
    </header>
  );
}
