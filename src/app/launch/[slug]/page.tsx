import type { Metadata } from 'next';
import Link from 'next/link';
import { LaunchDetail } from '@/components/LaunchDetail';
import { getAllLaunches, getLaunchBySlug } from '@/lib/launches';
import { isFinished } from '@/lib/status';
import { notFound } from 'next/navigation';
import styles from './page.module.css';

// With a static export every page must be known at build time: one per launch in the data file.
export function generateStaticParams() {
  return getAllLaunches().map((launch) => ({ slug: launch.slug }));
}

export async function generateMetadata({ params }: PageProps<'/launch/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const launch = getLaunchBySlug(slug);
  if (!launch) return {};
  return {
    title: launch.name,
    description: `${launch.rocket.fullName} · ${launch.provider.name} · ${launch.pad.locationName}`,
  };
}

export default async function LaunchPage({ params }: PageProps<'/launch/[slug]'>) {
  const { slug } = await params;
  const launch = getLaunchBySlug(slug);
  if (!launch) notFound();

  return (
    <>
      <Link href="/" className={styles.back}>
        ← All launches
      </Link>
      <LaunchDetail launch={launch} eyebrow={isFinished(launch.status) ? 'Recent launch' : 'Launch'} />
    </>
  );
}
