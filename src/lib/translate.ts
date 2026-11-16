import glossaryJson from '../../data/glossary.zh.json';
import translationsJson from '../../data/translations.zh.json';
import type { Locale } from './locale';

/*
 * Chinese wording for text that comes from Launch Library.
 *
 * Both languages are built from the same launches.json; only the wording differs.
 * Lookup order for an English text on a Chinese page:
 *   1. data/glossary.zh.json      reviewed names (always wins)
 *   2. data/translations.zh.json  machine translations made by scripts/translate.ts
 *   3. the English text itself    marked as English, so it is never passed off as Chinese
 */

const glossary: Record<string, string> = glossaryJson.names;
const translations: Record<string, string> = translationsJson.entries;

export interface LocalizedText {
  text: string;
  /** The language `text` is actually in, for the `lang` attribute. */
  lang: 'en' | 'zh-Hans';
  /** True when a Chinese page had to fall back to the English original. */
  isOriginal: boolean;
}

export function localizeText(english: string, locale: Locale): LocalizedText {
  if (locale === 'en') return { text: english, lang: 'en', isOriginal: false };
  const key = english.trim();
  const chinese = glossary[key] ?? translations[key];
  if (chinese !== undefined) return { text: chinese, lang: 'zh-Hans', isOriginal: false };
  return { text: english, lang: 'en', isOriginal: true };
}

/** Just the string, for places that cannot hold markup (alt text, page titles). */
export function localizeName(english: string, locale: Locale): string {
  return localizeText(english, locale).text;
}
