'use client';

import { useNowSeconds } from '@/lib/clientTime';
import styles from './Countdown.module.css';

/** Live days / hours / minutes / seconds until `targetIso`. */
export function Countdown({ targetIso }: { targetIso: string }) {
  const now = useNowSeconds();
  const target = Math.floor(new Date(targetIso).getTime() / 1000);

  // Before the browser takes over we do not know the time, so show dashes.
  const secondsLeft = now === null ? null : Math.max(0, target - now);
  const pad = (value: number) => String(Math.floor(value)).padStart(2, '0');
  const units = [
    { label: 'days', value: secondsLeft === null ? '--' : pad(secondsLeft / 86400) },
    { label: 'hours', value: secondsLeft === null ? '--' : pad((secondsLeft % 86400) / 3600) },
    { label: 'min', value: secondsLeft === null ? '--' : pad((secondsLeft % 3600) / 60) },
    { label: 'sec', value: secondsLeft === null ? '--' : pad(secondsLeft % 60) },
  ];

  return (
    <div>
      {/* role="timer" tells screen readers not to announce every tick */}
      <div className={styles.countdown} role="timer" aria-label="Time until launch">
        {units.map((unit) => (
          <div key={unit.label}>
            <b>{unit.value}</b>
            <i>{unit.label}</i>
          </div>
        ))}
      </div>
      {secondsLeft === 0 && (
        <p className={styles.note}>The scheduled time has passed. Waiting for the next data update.</p>
      )}
    </div>
  );
}
