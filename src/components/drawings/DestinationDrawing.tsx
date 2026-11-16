import type { Locale } from '@/lib/locale';
import type { ReactNode } from 'react';
import type { OrbitKind } from '@/lib/types';
import pen from './pen.module.css';
import { PlateSvg } from './PlateSvg';

/**
 * Where the payload is going. One drawing per OrbitKind.
 * The accent element is always the destination itself (the satellite on its
 * orbit, the Moon, the probe heading out).
 */

interface Drawing {
  /** What a screen reader hears instead of seeing the picture. */
  label: string;
  chineseLabel: string;
  shapes: ReactNode;
}

/** The big Earth whose top edge shows at the bottom of the frame (from the mockup). */
const earthHorizon = (
  <>
    <circle cx="40" cy="98" r="52" />
    <ellipse cx="40" cy="98" rx="22" ry="52" />
    <path d="M-6 66q46-14 92 0" />
  </>
);

// `Record<OrbitKind, Drawing>` makes TypeScript check that every kind has a
// drawing: if someone adds a new OrbitKind to types.ts, this stops compiling.
const DRAWINGS: Record<OrbitKind, Drawing> = {
  low_earth: {
    label: "Earth's curve with a dashed orbit just above it and a satellite on the orbit",
    chineseLabel: '地球弧面上方有一条虚线轨道，轨道上有一颗卫星',
    shapes: (
      <>
        {earthHorizon}
        <circle className={pen.dash} cx="40" cy="98" r="68" />
        <circle className={pen.hot} cx="68.7" cy="36.4" r="3.2" />
      </>
    ),
  },
  polar: {
    label: 'A globe with a dashed orbit passing over the north and south poles',
    chineseLabel: '一条虚线轨道经过地球的南北两极',
    shapes: (
      <>
        <circle cx="40" cy="36" r="15" />
        <path d="M25 36q15 6 30 0" />
        {/* Earth's axis poking out at both poles */}
        <path d="M40 21v-5M40 51v5" />
        <ellipse className={pen.dash} cx="40" cy="36" rx="8" ry="26" transform="rotate(-15 40 36)" />
        <circle className={pen.hot} cx="33.3" cy="10.9" r="3.2" />
      </>
    ),
  },
  geostationary: {
    label: 'A small Earth with a satellite far out on a wide dashed orbit, fixed above one spot',
    chineseLabel: '一颗卫星沿远离地球的虚线轨道运行，位于地面同一地点上方',
    shapes: (
      <>
        <circle cx="14" cy="32" r="9" />
        <path d="M5 32q9 4 18 0" />
        {/* The orbit is so wide only its far edge fits in the frame. */}
        <circle className={pen.dash} cx="14" cy="32" r="52" />
        {/* A geostationary satellite always hangs over the same place. */}
        <path className={pen.dash} d="M25 32h36" />
        <circle className={pen.hot} cx="66" cy="32" r="3.2" />
      </>
    ),
  },
  lunar: {
    label: 'A dashed path from Earth to the Moon',
    chineseLabel: '一条虚线从地球通向月球',
    shapes: (
      <>
        <circle cx="16" cy="48" r="10" />
        <path d="M6 48q10 4 20 0" />
        <path className={pen.dash} d="M23 40C26 18 40 10 53 13" />
        <circle className={pen.hot} cx="62" cy="16" r="8" />
      </>
    ),
  },
  deep_space: {
    label: 'A dashed path leaving Earth, passing the Moon and heading out of the frame, with a probe on it',
    chineseLabel: '一艘探测器沿虚线路径离开地球，飞过月球后飞出画面',
    shapes: (
      <>
        <circle cx="14" cy="48" r="8" />
        <path d="M6 48q8 3.5 16 0" />
        <circle cx="30" cy="27" r="3" />
        <path className={pen.dash} d="M21 43C40 34 56 20 84 8" />
        <circle className={pen.hot} cx="61.6" cy="19.2" r="3.2" />
      </>
    ),
  },
  suborbital: {
    label: 'A dashed arc that rises from the ground and comes back down',
    chineseLabel: '一条虚线弧从地面升起后返回地面',
    shapes: (
      <>
        <path d="M4 54q36-8 72 0" />
        <path className={pen.dash} d="M14 52Q40-8 66 52" />
        <circle className={pen.hot} cx="40" cy="22" r="3.2" />
      </>
    ),
  },
  unknown: {
    label: "Earth's curve with a dashed question mark where the orbit would be",
    chineseLabel: '地球弧面上方的虚线问号表示轨道未知',
    shapes: (
      <>
        {earthHorizon}
        <path className={pen.dash} d="M31 18C31 6 49 6 49 16C49 23 40 24 40 31" />
        <circle className={pen.hot} cx="40" cy="38" r="2.6" />
      </>
    ),
  },
};

export function DestinationDrawing({ kind, locale }: { kind: OrbitKind; locale: Locale }) {
  const drawing = DRAWINGS[kind];
  return <PlateSvg label={locale === 'zh-Hans' ? drawing.chineseLabel : drawing.label}>{drawing.shapes}</PlateSvg>;
}
