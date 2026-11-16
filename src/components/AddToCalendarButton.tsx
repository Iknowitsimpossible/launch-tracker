'use client';

import type { Locale } from '@/lib/locale';
import { buildIcs } from '@/lib/ics';
import type { Launch } from '@/lib/types';
import styles from './ButtonLink.module.css';

/** Builds an .ics file in the browser and downloads it. No server involved. */
export function AddToCalendarButton({ launch, locale }: { launch: Launch; locale: Locale }) {
  function download() {
    const file = new Blob([buildIcs(launch, new Date(), locale)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${launch.slug}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" className={styles.button} onClick={download}>
      {locale === 'zh-Hans' ? '添加到日历' : 'Add to calendar'}
    </button>
  );
}
