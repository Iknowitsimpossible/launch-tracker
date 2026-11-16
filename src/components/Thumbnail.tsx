'use client';

import type { Locale } from '@/lib/locale';
import { useState } from 'react';
import { isHttpUrl } from '@/lib/links';
import type { Launch } from '@/lib/types';
import { RemoteImage } from './RemoteImage';
import styles from './Thumbnail.module.css';

/** Square list picture. Fills whatever box the parent gives it; a plain tile keeps the row aligned without a picture. */
export function Thumbnail({ launch, locale }: { launch: Launch; locale: Locale }) {
  const [failed, setFailed] = useState(false);
  const url = launch.image?.thumbnailUrl;

  if (!url || failed || !isHttpUrl(url)) return <div className={styles.empty} aria-hidden="true" />;

  return (
    <div className={styles.frame}>
      <RemoteImage src={url} alt={locale === 'zh-Hans' ? `${launch.rocket.name} 发射照片` : `${launch.rocket.name} launch photo`} lazy onFailed={() => setFailed(true)} />
    </div>
  );
}
