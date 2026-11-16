import type { Locale } from '@/lib/locale';
import { statusText, statusTone } from '@/lib/status';
import type { Launch } from '@/lib/types';
import styles from './StatusTag.module.css';

/** The small pill with the launch status. Colour and border style show how certain or final it is. */
export function StatusTag({ launch, locale }: { launch: Launch; locale: Locale }) {
  return <span className={`${styles.tag} ${styles[statusTone(launch)]}`}>{statusText(launch, locale)}</span>;
}
