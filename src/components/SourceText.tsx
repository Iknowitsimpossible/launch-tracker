import type { Locale } from '@/lib/locale';
import { localizeText } from '@/lib/translate';
import styles from './SourceText.module.css';

interface SourceTextProps {
  /** English text from the launch data. */
  text: string;
  locale: Locale;
  /**
   * 'prose' marks an untranslated sentence with a small 原文 ("original text")
   * label, so readers know it was not translated. 'name' does not: an English
   * rocket or place name in a Chinese sentence is normal.
   */
  kind?: 'name' | 'prose';
}

/** Text that came from Launch Library, in the page's language when a translation exists. */
export function SourceText({ text, locale, kind = 'name' }: SourceTextProps) {
  const localized = localizeText(text, locale);
  if (!localized.isOriginal) return <>{localized.text}</>;
  return (
    <>
      <span lang="en">{localized.text}</span>
      {kind === 'prose' && <span className={styles.original}>原文</span>}
    </>
  );
}
