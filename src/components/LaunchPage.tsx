import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllLaunches, getLaunchBySlug } from '@/lib/launches';
import { formatLaunchTime } from '@/lib/formatTime';
import { localizedPath, type Locale } from '@/lib/locale';
import { languageAlternates, socialCard } from '@/lib/metadata';
import { SITE_NAME } from '@/lib/site';
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
  const path = `/launch/${launch.slug}/`;
  const title = localizeName(launch.name, locale);
  // The time goes last: it's what someone glancing at a shared link wants to know.
  // Link previews are made by a server with no time zone, so the time is in UTC.
  const when = formatLaunchTime(launch.net, launch.netPrecision, { withZone: true, fixed: true, locale });
  const description = [launch.rocket.fullName, launch.provider.name, launch.pad.locationName]
    .map((name) => localizeName(name, locale))
    .concat(when)
    .join(' · ');
  return {
    title,
    description,
    alternates: languageAlternates(locale, path),
    ...socialCard({
      locale,
      path,
      title: `${title} · ${SITE_NAME}`,
      description,
      photo: launch.image && { url: launch.image.url, alt: title },
    }),
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
