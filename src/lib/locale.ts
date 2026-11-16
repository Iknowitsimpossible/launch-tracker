export type Locale = 'en' | 'zh-Hans';

export function localizedPath(locale: Locale, path: string): string {
  return locale === 'zh-Hans' ? `/zh${path}` : path;
}
