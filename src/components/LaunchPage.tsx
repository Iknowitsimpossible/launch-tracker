import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllLaunches, getLaunchBySlug } from '@/lib/launches';
import { localizedPath, type Locale } from '@/lib/locale';
import { isFinished } from '@/lib/status';
import { localizeName } from '@/lib/translate';
import { LaunchDetail } from './LaunchDetail';
import { SiteFrame } from './SiteFrame';
import styles from './LaunchPage.module.css';

export function launchStaticParams() {
  return getAllLaunches().map((launch) => ({ slug: launch.slug }));
}

export function launchMetadata(slug: string, locale: Locale = 'en'): Metadata {
  const launch = getLaunchBySlug(slug);
  if (!launch) return {};
  return {
    title: localizeName(launch.name, locale),
    description: [launch.rocket.fullName, launch.provider.name, launch.pad.locationName]
      .map((name) => localizeName(name, locale))
      .join(' · '),
  };
}

export function LaunchPage({ slug, locale }: { slug: string; locale: Locale }) {
  const launch = getLaunchBySlug(slug);
  if (!launch) notFound();
  const chinese = locale === 'zh-Hans';
  const eyebrow = isFinished(launch.status)
    ? (chinese ? '近期发射' : 'Recent launch')
    : (chinese ? '发射任务' : 'Launch');

  return (
    <SiteFrame locale={locale} path={`/launch/${launch.slug}/`}>
      <Link href={localizedPath(locale, '/')} className={styles.back}>
        {chinese ? '← 所有发射' : '← All launches'}
      </Link>
      <LaunchDetail launch={launch} eyebrow={eyebrow} locale={locale} />
    </SiteFrame>
  );
}
