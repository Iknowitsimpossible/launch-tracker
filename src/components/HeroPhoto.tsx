'use client';

import type { Locale } from '@/lib/locale';
import { useState } from 'react';
import { isHttpUrl } from '@/lib/links';
import type { Launch } from '@/lib/types';
import { RemoteImage } from './RemoteImage';
import styles from './HeroPhoto.module.css';

/** The big photo at the top. Renders nothing at all when there is no usable picture. */
export function HeroPhoto({ launch, locale }: { launch: Launch; locale: Locale }) {
  const chinese = locale === 'zh-Hans';
  const [failed, setFailed] = useState(false);
  const image = launch.image;
  if (!image || failed || !isHttpUrl(image.url)) return null;

  return (
    <figure className={styles.photo}>
      <RemoteImage src={image.url} alt={chinese ? `${launch.rocket.fullName} 火箭照片` : `Photo of a ${launch.rocket.fullName} rocket`} onFailed={() => setFailed(true)} />
      {image.credit && <figcaption className={styles.credit}>{chinese ? '图片来源：' : 'Photo: '}{image.credit}</figcaption>}
    </figure>
  );
}
