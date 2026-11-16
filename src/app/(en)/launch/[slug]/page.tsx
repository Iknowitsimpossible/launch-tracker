import { LaunchPage, launchMetadata, launchStaticParams } from '@/components/LaunchPage';

export function generateStaticParams() {
  return launchStaticParams();
}

export async function generateMetadata({ params }: PageProps<'/launch/[slug]'>) {
  return launchMetadata((await params).slug);
}

export default async function Page({ params }: PageProps<'/launch/[slug]'>) {
  return <LaunchPage slug={(await params).slug} locale="en" />;
}
