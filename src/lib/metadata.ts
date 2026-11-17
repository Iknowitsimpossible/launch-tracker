import type { Metadata } from 'next';
import { localizedPath, type Locale } from './locale';
import { SITE_NAME, SITE_URL } from './site';

/*
 * Metadata shared by every page: the address the page "really" lives at, its
 * other-language twin, and the card shown when someone pastes a link into a
 * chat app or social site.
 *
 * Every path here is written WITHOUT the base path ("/launch/x/", not
 * "/launch-tracker/launch/x/"): `metadataBase` already ends in the base path,
 * and Next resolves these paths against it.
 */

export const metadataBase = new URL(`${SITE_URL}/`);

/** Canonical address plus hreflang links, for a page that exists in both languages. */
export function languageAlternates(locale: Locale, path: string): Metadata['alternates'] {
  return {
    canonical: localizedPath(locale, path),
    languages: {
      en: path,
      'zh-Hans': localizedPath('zh-Hans', path),
      'x-default': path,
    },
  };
}

interface SocialCard {
  locale: Locale;
  /** The page's own path, e.g. "/launch/x/" (the locale prefix is added here). */
  path: string;
  title: string;
  description: string;
  /** A launch photo. Without one, the site icon is used and the card is small. */
  photo?: { url: string; alt: string } | null;
}

/**
 * Open Graph and X/Twitter card tags. Next replaces a parent's `openGraph`
 * object instead of merging it, so every page passes the complete set.
 */
export function socialCard({ locale, path, title, description, photo }: SocialCard): Pick<Metadata, 'openGraph' | 'twitter'> {
  const image = photo ?? { url: '/icon-512.png', alt: SITE_NAME };
  return {
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: locale === 'zh-Hans' ? 'zh_CN' : 'en_US',
      url: localizedPath(locale, path),
      title,
      description,
      images: [image],
    },
    twitter: {
      card: photo ? 'summary_large_image' : 'summary',
      title,
      description,
      images: [image.url],
    },
  };
}
