import type { Locale } from '@/lib/locale';
import type { ReactNode } from 'react';
import type { LandingKind } from '@/lib/types';
import pen from './pen.module.css';
import { PlateSvg } from './PlateSvg';

/**
 * How the first-stage booster comes back. One drawing per LandingKind.
 * The accent element is the booster's way down (its descent line, its
 * parachute) or, when it is thrown away, the spot where it hits the sea.
 */

interface Drawing {
  label: string;
  chineseLabel: string;
  shapes: ReactNode;
}

/** A booster standing on its four legs (two visible), from the mockup. */
const boosterOnLegs = (
  <>
    <rect x="37" y="13" width="6" height="31" />
    <path d="M37 36l-8 8M43 36l8 8" />
  </>
);

/** The dashed accent line above the booster: the way it came down. */
const descentLine = <path className={pen.hotLine} d="M40 2v8" />;

/** A row of small waves; `y` is the calm-water level. */
function waves(y: number) {
  return <path d={`M2 ${y}q5-5 10 0t10 0 10 0 10 0 10 0 10 0 10 0 10 0`} />;
}

const DRAWINGS: Record<LandingKind, Drawing> = {
  droneship: {
    label: 'A booster standing on a barge at sea',
    chineseLabel: '一枚助推器立在海上的回收船上',
    shapes: (
      <>
        {descentLine}
        {boosterOnLegs}
        <rect className={pen.solid} x="16" y="44" width="48" height="5" />
        {waves(56)}
      </>
    ),
  },
  landing_pad: {
    label: 'A booster standing on a round landing pad on the ground',
    chineseLabel: '一枚助推器立在地面的圆形着陆区内',
    shapes: (
      <>
        {descentLine}
        {boosterOnLegs}
        <ellipse cx="40" cy="47" rx="18" ry="3" />
        <path d="M4 50h72" />
      </>
    ),
  },
  ocean: {
    label: 'A booster coming down under a parachute into the sea',
    chineseLabel: '一枚助推器借助降落伞降落到海中',
    shapes: (
      <>
        <path className={pen.hotStroke} d="M24 14Q40-4 56 14Q40 9 24 14" />
        <path d="M24 14l13 12M56 14L43 26" />
        <rect x="37" y="26" width="6" height="26" />
        {waves(54)}
      </>
    ),
  },
  expended: {
    label: 'A dashed booster tumbling into the sea, not recovered',
    chineseLabel: '一枚以虚线绘制的助推器翻滚落海，未回收',
    shapes: (
      <>
        <rect className={pen.dash} x="33" y="12" width="6" height="28" transform="rotate(35 36 26)" />
        <path className={pen.hotStroke} d="M57 45l6 6M63 45l-6 6" />
        {waves(56)}
      </>
    ),
  },
  other: {
    label: 'A booster landing on an unknown surface',
    chineseLabel: '一枚助推器在未知地点着陆',
    shapes: (
      <>
        {descentLine}
        {boosterOnLegs}
        <path className={pen.dash} d="M6 44.5h68" />
      </>
    ),
  },
};

export function LandingDrawing({ kind, locale }: { kind: LandingKind; locale: Locale }) {
  const drawing = DRAWINGS[kind];
  return <PlateSvg label={locale === 'zh-Hans' ? drawing.chineseLabel : drawing.label}>{drawing.shapes}</PlateSvg>;
}
