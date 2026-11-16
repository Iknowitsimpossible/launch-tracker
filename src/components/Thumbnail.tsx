'use client';

import { useState } from 'react';
import { isHttpUrl } from '@/lib/links';
import type { Launch } from '@/lib/types';
import { RemoteImage } from './RemoteImage';
import styles from './Thumbnail.module.css';

/** Square list picture. Fills whatever box the parent gives it; a plain tile keeps the row aligned without a picture. */
export function Thumbnail({ launch }: { launch: Launch }) {
  const [failed, setFailed] = useState(false);
  const url = launch.image?.thumbnailUrl;

  if (!url || failed || !isHttpUrl(url)) return <div className={styles.empty} aria-hidden="true" />;

  return (
    <div className={styles.frame}>
      <RemoteImage src={url} alt={`${launch.rocket.name} launch photo`} lazy onFailed={() => setFailed(true)} />
    </div>
  );
}
