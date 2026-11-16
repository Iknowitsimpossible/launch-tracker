'use client';

import { useState } from 'react';
import { isHttpUrl } from '@/lib/links';
import type { Launch } from '@/lib/types';
import { RemoteImage } from './RemoteImage';
import styles from './HeroPhoto.module.css';

/** The big photo at the top. Renders nothing at all when there is no usable picture. */
export function HeroPhoto({ launch }: { launch: Launch }) {
  const [failed, setFailed] = useState(false);
  const image = launch.image;
  if (!image || failed || !isHttpUrl(image.url)) return null;

  return (
    <figure className={styles.photo}>
      <RemoteImage src={image.url} alt={`Photo of a ${launch.rocket.fullName} rocket`} onFailed={() => setFailed(true)} />
      {image.credit && <figcaption className={styles.credit}>Photo: {image.credit}</figcaption>}
    </figure>
  );
}
