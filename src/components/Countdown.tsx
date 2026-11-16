'use client';

import type { Locale } from '@/lib/locale';
import { useNowSeconds } from '@/lib/clientTime';
import styles from './Countdown.module.css';

/** Live days / hours / minutes / seconds until `targetIso`. */
export function Countdown({ targetIso, locale }: { targetIso: string; locale: Locale }) {
  const chinese = locale === 'zh-Hans';
  const now = useNowSeconds();
  const target = Math.floor(new Date(targetIso).getTime() / 1000);

  // Before the browser takes over we do not know the time, so show dashes.
  const secondsLeft = now === null ? null : Math.max(0, target - now);
  const pad = (value: number) => String(Math.floor(value)).padStart(2, '0');
  const units = [
    { label: chinese ? '天' : 'days', value: secondsLeft === null ? '--' : pad(secondsLeft / 86400) },
    { label: chinese ? '小时' : 'hours', value: secondsLeft === null ? '--' : pad((secondsLeft % 86400) / 3600) },
    { label: chinese ? '分' : 'min', value: secondsLeft === null ? '--' : pad((secondsLeft % 3600) / 60) },
    { label: chinese ? '秒' : 'sec', value: secondsLeft === null ? '--' : pad(secondsLeft % 60) },
  ];

  return (
    <div>
      {/* role="timer" tells screen readers not to announce every tick */}
      <div className={styles.countdown} role="timer" aria-label={chinese ? '发射倒计时' : 'Time until launch'}>
        {units.map((unit) => (
          <div key={unit.label}>
            <b>{unit.value}</b>
            <i>{unit.label}</i>
          </div>
        ))}
      </div>
      {secondsLeft === 0 && (
        <p className={styles.note}>
          {chinese ? '已过计划发射时间，正在等待数据更新。' : 'The scheduled time has passed. Waiting for the next data update.'}
        </p>
      )}
    </div>
  );
}
