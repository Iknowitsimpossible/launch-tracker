import { launchData } from '@/lib/launches';
import { LocalTime } from './LocalTime';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <p>Launch data from Launch Library 2 by The Space Devs. Weather from Open-Meteo.</p>
      <p>
        Data last updated: <LocalTime iso={launchData.generatedAt} showZone />
      </p>
    </footer>
  );
}
