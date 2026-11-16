import type { Locale } from '@/lib/locale';
import pen from './pen.module.css';
import { PlateSvg } from './PlateSvg';

/** More helmets than this would be too small to read at 100 px wide. */
const MAX_HELMETS = 12;

interface HelmetSpot {
  cx: number;
  cy: number;
  r: number;
}

/**
 * Works out where to draw `count` helmets inside the 80 x 64 frame.
 * Up to 4 sit in one row at full size (as in the mockup); more are split
 * into two rows and shrink just enough to fit across.
 */
function layoutHelmets(count: number): HelmetSpot[] {
  const rows = count <= 4 ? 1 : 2;
  const perRow = Math.ceil(count / rows);
  const spacing = 76 / Math.max(perRow, 4); // never wider apart than the mockup's 4
  const r = Math.min(8, spacing / 2 - 1);
  const rowYs = rows === 1 ? [34] : [21, 45];

  const spots: HelmetSpot[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const inThisRow = row === rows - 1 ? count - perRow * row : perRow;
    const col = i - perRow * row;
    // Centre each row, so an odd last row still looks balanced.
    const rowWidth = spacing * (inThisRow - 1);
    spots.push({ cx: 40 - rowWidth / 2 + col * spacing, cy: rowYs[row], r });
  }
  return spots;
}

/** An empty seat: a dashed circle with a dashed visor line, exactly the mockup's shape. */
function EmptyHelmet({ spot }: { spot: HelmetSpot }) {
  const { cx, cy, r } = spot;
  return (
    <>
      <circle className={pen.dash} cx={cx} cy={cy} r={r} />
      <path className={pen.dash} d={`M${cx - r * 0.625} ${cy + r * 0.25}h${r * 1.25}`} />
    </>
  );
}

/**
 * A filled seat: a solid circle with a rounded visor window. (A straight visor
 * line inside a solid circle reads as a "no entry" sign, so the crewed helmet
 * gets a proper window instead.)
 */
function Helmet({ spot, visorClassName }: { spot: HelmetSpot; visorClassName?: string }) {
  const { cx, cy, r } = spot;
  return (
    <>
      <circle cx={cx} cy={cy} r={r} />
      <rect
        className={visorClassName}
        x={cx - r * 0.62}
        y={cy - r * 0.42}
        width={r * 1.24}
        height={r * 0.78}
        rx={r * 0.32}
      />
    </>
  );
}

/**
 * Who is aboard. Uncrewed: four dashed (empty) helmets, exactly as in the mockup.
 * Crewed: one solid-line helmet per astronaut; the commander's visor is the accent.
 */
export function CrewDrawing({ crewCount, commanderIndex, locale }: {
  crewCount: number;
  commanderIndex: number;
  locale: Locale;
}) {
  const chinese = locale === 'zh-Hans';
  if (crewCount === 0) {
    return (
      <PlateSvg label={chinese ? '四顶虚线头盔，表示无人搭乘' : 'Four empty, dashed helmets: no one aboard'}>
        {layoutHelmets(4).map((spot, i) => (
          <EmptyHelmet key={i} spot={spot} />
        ))}
      </PlateSvg>
    );
  }

  const drawn = Math.min(crewCount, MAX_HELMETS);
  // If the commander is listed beyond the helmets we draw, highlight the first one.
  const highlighted = commanderIndex < drawn ? commanderIndex : 0;
  const label = chinese
    ? (crewCount === 1 ? '一顶航天员头盔' : `${crewCount} 顶航天员头盔，其中指令长的头盔以强调色显示`)
    : (crewCount === 1 ? 'One astronaut helmet' : `${crewCount} astronaut helmets, the commander's highlighted`);
  return (
    <PlateSvg label={label}>
      {layoutHelmets(drawn).map((spot, i) => (
        <Helmet key={i} spot={spot} visorClassName={i === highlighted ? pen.hot : undefined} />
      ))}
    </PlateSvg>
  );
}
