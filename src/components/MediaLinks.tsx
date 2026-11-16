import type { Locale } from '@/lib/locale';
import { isHttpUrl } from '@/lib/links';
import type { Launch } from '@/lib/types';
import { ButtonLink } from './ButtonLink';
import { Panel } from './Panel';
import styles from './MediaLinks.module.css';

/** Webcasts and info pages. Renders nothing when there are no usable links. */
export function MediaLinks({ launch, locale }: { launch: Launch; locale: Locale }) {
  const webcasts = launch.webcasts.filter((link) => isHttpUrl(link.url));
  const infoLinks = launch.infoLinks.filter((link) => isHttpUrl(link.url));
  if (webcasts.length === 0 && infoLinks.length === 0) return null;

  return (
    <Panel title={locale === 'zh-Hans' ? '图片与视频' : 'Photos & video'}>
      <div className={styles.links}>
        {webcasts.map((link, index) => (
          <ButtonLink key={link.url} href={link.url} primary={index === 0}>
            <span aria-hidden="true">▶ </span>
            {link.title}
            {link.source ? ` (${link.source})` : ''}
          </ButtonLink>
        ))}
        {infoLinks.map((link) => (
          <ButtonLink key={link.url} href={link.url}>
            {link.title}
            {link.source ? ` (${link.source})` : ''}
          </ButtonLink>
        ))}
      </div>
    </Panel>
  );
}
