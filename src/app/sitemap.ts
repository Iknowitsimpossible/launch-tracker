import type { MetadataRoute } from 'next';
import { getAllLaunches, launchData } from '@/lib/launches';
import { SITE_URL } from '@/lib/site';

// Served as /sitemap.xml. With output: 'export' it must be built ahead of time.
export const dynamic = 'force-static';

/**
 * Every page in both languages, so search engines find launch pages without
 * having to crawl the home page first. Submit it once in Google Search Console:
 * a GitHub Pages project site can't publish a robots.txt that crawlers read
 * (robots.txt only counts at the domain root), so it can't advertise this file.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['/', ...getAllLaunches().map((launch) => `/launch/${launch.slug}/`)];
  // Google wants each language listed as its own entry, each naming both versions.
  return paths.flatMap((path) => {
    const languages = { en: `${SITE_URL}${path}`, 'zh-Hans': `${SITE_URL}/zh${path}` };
    return Object.values(languages).map((url) => ({
      url,
      lastModified: launchData.generatedAt,
      alternates: { languages },
    }));
  });
}
