import type { Locale } from '@/lib/locale';
import type { ReactNode } from 'react';
import type { PayloadKind } from '@/lib/types';
import pen from './pen.module.css';
import { PlateSvg } from './PlateSvg';

/**
 * What the rocket carries. One drawing per PayloadKind.
 * The accent element is the part that says what the payload is for
 * (the crew window, the cargo, the signal, the view of Earth...).
 */

interface Drawing {
  label: string;
  chineseLabel: string;
  shapes: ReactNode;
}

/** Two solar panels with cell lines and their arms, shared by the satellite drawings. */
const solarPanels = (
  <>
    <rect x="6" y="25" width="22" height="14" />
    <rect x="52" y="25" width="22" height="14" />
    <path d="M13.3 25v14M20.6 25v14M59.3 25v14M66.6 25v14M28 32h6M46 32h6" />
  </>
);

/** A capsule: a blunt cone with a heat shield at the base and a docking port on top. */
const capsule = <path d="M24 48h32M27 48l6-26q7-6 14 0l6 26M37 18.5V15h6v3.5" />;

const DRAWINGS: Record<PayloadKind, Drawing> = {
  crew: {
    label: 'A crew capsule with a window',
    chineseLabel: '带舷窗的载人舱',
    shapes: (
      <>
        {capsule}
        <circle className={pen.hot} cx="40" cy="33" r="3.4" />
      </>
    ),
  },
  cargo: {
    label: 'A cargo capsule with a crate inside and a trunk below',
    chineseLabel: '货运舱内有货箱，下方连接货舱段',
    shapes: (
      <>
        {capsule}
        <rect x="29" y="48" width="22" height="10" />
        <rect className={pen.hot} x="35.5" y="30" width="9" height="9" />
      </>
    ),
  },
  communications: {
    label: 'A satellite with a dish sending a signal',
    chineseLabel: '一颗带碟形天线的卫星正在发送信号',
    shapes: (
      <>
        {solarPanels}
        <rect x="34" y="28" width="12" height="16" />
        <path d="M31 16q9 12 18 0M40 22v6" />
        <path className={pen.hotStroke} d="M35 10q5-3 10 0M31 5q9-6 18 0" />
      </>
    ),
  },
  earth_observation: {
    label: "A satellite looking down at a patch of Earth's surface",
    chineseLabel: '一颗卫星正在观测地球表面的一片区域',
    shapes: (
      <>
        <rect x="19" y="11" width="14" height="6" />
        <rect x="47" y="11" width="14" height="6" />
        <rect x="35" y="8" width="10" height="12" />
        <path d="M33 14h2M45 14h2" />
        <path d="M2 58Q40 46 78 58" />
        <path className={pen.dash} d="M37 21l-11 31.8M43 21l11 31.8" />
        <path className={pen.hotStroke} d="M26 52.8Q40 51.2 54 52.8" />
      </>
    ),
  },
  navigation: {
    label: 'Three satellites on an orbit sending signals down to one point on the ground',
    chineseLabel: '轨道上的三颗卫星向地面同一点发送信号',
    shapes: (
      <>
        <path className={pen.dash} d="M4 28Q40 0 76 28" />
        <rect x="11.8" y="17.9" width="6" height="6" />
        <rect x="37" y="11" width="6" height="6" />
        <rect x="62.2" y="17.9" width="6" height="6" />
        <path className={pen.dash} d="M16 25l22 24M40 18v30M64 25L42 49" />
        <path d="M8 56h64" />
        <circle className={pen.hot} cx="40" cy="52" r="3.2" />
      </>
    ),
  },
  science: {
    label: 'A space telescope pointed at a star',
    chineseLabel: '一台太空望远镜对准一颗恒星',
    shapes: (
      <>
        <g transform="rotate(-35 36 40)">
          <rect x="12" y="33" width="30" height="14" />
          <path d="M42 31h12v18H42" />
          <path d="M20 47v6h14v-6" />
        </g>
        <path className={pen.hot} d="M68 4l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
      </>
    ),
  },
  classified: {
    label: 'A satellite with its body covered by a redaction bar',
    chineseLabel: '一颗卫星的主体被遮挡',
    shapes: (
      <>
        {solarPanels}
        <rect x="34" y="22" width="12" height="20" />
        <path d="M40 22v-7M36 13q4-5 8 0" />
        <rect className={pen.hot} x="27" y="28" width="26" height="8" />
      </>
    ),
  },
  test: {
    label: 'A plain test mass on a payload adapter, marked with a camera target',
    chineseLabel: '载荷适配器上的试验配重，上有相机标记',
    shapes: (
      <>
        <ellipse cx="40" cy="18" rx="14" ry="4" />
        <path d="M26 18v28M54 18v28M26 46q14 8 28 0M30 50l-4 8h28l-4-8" />
        <circle cx="40" cy="32" r="7" />
        <path className={pen.hot} d="M40 32v-7a7 7 0 0 1 7 7zM40 32v7a7 7 0 0 1-7-7z" />
      </>
    ),
  },
  other: {
    label: 'A generic satellite',
    chineseLabel: '一颗卫星',
    shapes: (
      <>
        {solarPanels}
        <path d="M40 22v-7M36 13q4-5 8 0" />
        <rect className={pen.hotStroke} x="34" y="22" width="12" height="20" />
      </>
    ),
  },
};

export function PayloadDrawing({ kind, locale }: { kind: PayloadKind; locale: Locale }) {
  const drawing = DRAWINGS[kind];
  return <PlateSvg label={locale === 'zh-Hans' ? drawing.chineseLabel : drawing.label}>{drawing.shapes}</PlateSvg>;
}
