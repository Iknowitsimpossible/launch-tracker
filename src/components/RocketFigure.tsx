import type { Locale } from '@/lib/locale';
import type { Booster, Launch, Rocket } from '@/lib/types';
import { compareHeight, compareMass, compareThrust, ordinal, plural } from '@/lib/comparisons';
import { RocketOutline } from './drawings/RocketOutline';
import { SourceText } from './SourceText';
import styles from './RocketFigure.module.css';

/** More markers than this turn into a long ribbon, so we draw the latest 30 only. */
const MAX_FLIGHT_MARKERS = 30;

/**
 * The rocket section's figure: an outline of the rocket with a height marker,
 * big numbers with everyday comparisons, and the booster's flight markers.
 *
 * Every line is optional: a missing number simply skips its row, so the figure
 * never shows "null", "NaN" or an empty box.
 */
export function RocketFigure({ launch, locale }: { launch: Launch; locale: Locale }) {
  const { rocket, booster } = launch;
  const stats = buildStats(rocket, locale);
  const heightLabel = isPositive(rocket.heightM) ? `${formatMetres(rocket.heightM)} m` : null;

  return (
    <div className={styles.rocket}>
      <RocketOutline heightLabel={heightLabel} locale={locale} />
      <div className={styles.bigstats}>
        {/* With no numbers at all, the rocket's name stands in for them. */}
        {stats.length === 0 && (
          <p className={styles.rocketName}>
            <SourceText text={rocket.fullName || rocket.name} locale={locale} />
          </p>
        )}

        {stats.map((stat) => (
          <div key={stat.caption}>
            <b className={styles.number}>{stat.value}</b>
            <span className={styles.note}>{stat.caption}</span>
          </div>
        ))}

        <BoosterLine booster={booster} reusable={rocket.reusable} locale={locale} />
        <TrackRecord rocket={rocket} locale={locale} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Big numbers
// ---------------------------------------------------------------------------

interface Stat {
  value: string; // "7,607 kN"
  caption: string; // "liftoff thrust, roughly 7 jumbo jets"
}

/** Builds only the rows whose numbers are known. */
function buildStats(rocket: Rocket, locale: Locale): Stat[] {
  const chinese = locale === 'zh-Hans';
  const stats: Stat[] = [];
  if (isPositive(rocket.heightM)) {
    stats.push({
      value: `${formatMetres(rocket.heightM)} m`,
      caption: withComparison(chinese ? '高度' : 'tall', compareHeight(rocket.heightM, locale), locale),
    });
  }
  if (isPositive(rocket.liftoffThrustKN)) {
    stats.push({
      value: `${Math.round(rocket.liftoffThrustKN).toLocaleString('en-US')} kN`,
      caption: withComparison(chinese ? '起飞推力' : 'liftoff thrust', compareThrust(rocket.liftoffThrustKN, locale), locale),
    });
  }
  if (isPositive(rocket.leoCapacityKg)) {
    stats.push({
      value: formatMass(rocket.leoCapacityKg),
      caption: withComparison(chinese ? '近地轨道运载能力' : 'to low orbit', compareMass(rocket.leoCapacityKg, locale), locale),
    });
  }
  return stats;
}

/** "tall" + "about a 20-storey building" -> "tall, about a 20-storey building". */
function withComparison(what: string, comparison: string | null, locale: Locale): string {
  return comparison ? `${what}${locale === 'zh-Hans' ? '，' : ', '}${comparison}` : what;
}

/** 70 -> "70", 41.06 -> "41", 8.4 -> "8.4". Decimals only matter for small rockets. */
function formatMetres(metres: number): string {
  return metres.toLocaleString('en-US', { maximumFractionDigits: metres < 10 ? 1 : 0 });
}

/**
 * Tonnes with one decimal below 100 t ("22.8 t"), whole tonnes above ("150 t").
 * Below one tonne we switch to kilograms, so 300 kg never reads "0.3 t" or "0.0 t".
 */
function formatMass(kg: number): string {
  if (kg < 1000) return `${Math.round(kg).toLocaleString('en-US')} kg`;
  const tonnes = kg / 1000;
  return `${tonnes.toLocaleString('en-US', { maximumFractionDigits: tonnes < 100 ? 1 : 0 })} t`;
}

/** true for a real, positive number; false for null, 0, negatives and NaN. */
function isPositive(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

// ---------------------------------------------------------------------------
// Booster and track record
// ---------------------------------------------------------------------------

function BoosterLine({ booster, reusable, locale }: { booster: Booster | null; reusable: boolean; locale: Locale }) {
  const chinese = locale === 'zh-Hans';
  if (!booster) {
    // No booster record: only worth saying something when the rocket is single-use.
    return reusable ? null : <span className={styles.note}>{chinese ? '一次性运载火箭' : 'Single-use rocket'}</span>;
  }

  const flights = booster.flightNumber;
  if (flights === null || !Number.isInteger(flights) || flights < 1) {
    return <span className={styles.note}>{chinese ? '助推器' : 'Booster'} {booster.serial}</span>;
  }

  const drawn = Math.min(flights, MAX_FLIGHT_MARKERS);
  const capNote = flights > MAX_FLIGHT_MARKERS
    ? (chinese ? `（显示最近 ${MAX_FLIGHT_MARKERS} 次）` : ` (the latest ${MAX_FLIGHT_MARKERS} shown)`)
    : '';
  return (
    <div>
      {/* One marker per flight; the last (this launch) in the accent colour.
          aria-hidden because the caption below says the same thing in words. */}
      <div className={styles.flights} aria-hidden="true">
        {Array.from({ length: drawn }, (_, i) => (
          <i key={i} className={i === drawn - 1 ? styles.thisFlight : styles.pastFlight} />
        ))}
      </div>
      <span className={styles.note}>
        {chinese ? `助推器 ${booster.serial}，第 ${flights} 次飞行` : `Booster ${booster.serial}, on its ${ordinal(flights)} flight`}
        {capNote}
      </span>
    </div>
  );
}

/** "645 of 646 launches successful", only when both counts are known. */
function TrackRecord({ rocket, locale }: { rocket: Rocket; locale: Locale }) {
  const { successfulLaunches, totalLaunches } = rocket;
  if (successfulLaunches === null || totalLaunches === null || totalLaunches < 1) return null;
  return (
    <span className={styles.note}>
      {locale === 'zh-Hans'
        ? `共发射 ${totalLaunches.toLocaleString('zh-Hans')} 次，成功 ${successfulLaunches.toLocaleString('zh-Hans')} 次`
        : `${successfulLaunches.toLocaleString('en-US')} of ${plural(totalLaunches, 'launch', 'launches')} successful`}
    </span>
  );
}
