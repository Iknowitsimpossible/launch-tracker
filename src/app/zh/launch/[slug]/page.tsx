import { LaunchPage, launchMetadata, launchStaticParams } from '@/components/LaunchPage';

export function generateStaticParams() {
  return launchStaticParams();
}

export async function generateMetadata({ params }: PageProps<'/zh/launch/[slug]'>) {
  return launchMetadata((await params).slug, 'zh-Hans');
}

export default async function Page({ params }: PageProps<'/zh/launch/[slug]'>) {
  return <LaunchPage slug={(await params).slug} locale="zh-Hans" />;
}
