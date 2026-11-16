import type { Locale } from '@/lib/locale';
import pen from './pen.module.css';

/**
 * One generic rocket outline, always drawn at the same size (the mockup's shape).
 * It is not to scale: the real height is told by the marker label on the right,
 * so an 18 m rocket and a 120 m rocket share the same picture.
 */
export function RocketOutline({ heightLabel, locale }: { heightLabel: string | null; locale: Locale }) {
  const description = locale === 'zh-Hans'
    ? (heightLabel ? `火箭轮廓，高 ${heightLabel}` : '火箭轮廓')
    : (heightLabel ? `Rocket outline, ${heightLabel} tall` : 'Rocket outline');
  return (
    <svg className={pen.sil} viewBox="0 0 96 240" role="img" aria-label={description}>
      {/* nose cone */}
      <path d="M40 6c8 14 11 30 11 44H29c0-14 3-30 11-44z" />
      {/* body, stage separation line, fins and engine bell */}
      <rect x="31" y="50" width="18" height="170" />
      <path d="M31 112h18M31 196l-11 26M49 196l11 26M35 220l-2 8h14l-2-8" />
      {heightLabel && (
        <>
          {/* height marker: a vertical line with end ticks, from nose tip to engine */}
          <path className={pen.dim} d="M74 6v222M69 6h10M69 228h10" />
          <text className={pen.dimLabel} x="80" y="121" transform="rotate(90 80 121)" textAnchor="middle">
            {heightLabel}
          </text>
        </>
      )}
    </svg>
  );
}
