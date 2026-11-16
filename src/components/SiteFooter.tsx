import { launchData } from '@/lib/launches';
import type { Locale } from '@/lib/locale';
import { LocalTime } from './LocalTime';
import styles from './SiteFooter.module.css';

export function SiteFooter({ locale }: { locale: Locale }) {
  const chinese = locale === 'zh-Hans';
  return (
    <footer className={styles.footer}>
      <p>
        {chinese
          ? '发射数据来自 The Space Devs 的 Launch Library 2，天气数据来自 Open-Meteo。'
          : 'Launch data from Launch Library 2 by The Space Devs. Weather from Open-Meteo.'}
      </p>
      <p>
        {chinese ? '数据更新于：' : 'Data last updated: '}
        <LocalTime iso={launchData.generatedAt} showZone locale={locale} />
      </p>
    </footer>
  );
}
