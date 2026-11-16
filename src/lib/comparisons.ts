/**
 * Everyday comparisons for the rocket's big numbers ("about a 20-storey building").
 *
 * The idea: each stat has a "ladder" of reference objects, biggest first. We walk
 * down the ladder and use the first object the value is at least ~3/4 of. That way
 * Falcon 9's 22.8 t reads "about 4 elephants" while a small rocket's 300 kg reads
 * "about 4 adults", instead of the useless "about 0 elephants".
 *
 * Every function here is pure (same input, same output, no side effects), so they
 * are easy to test and safe to call from server components.
 */

interface Reference {
  /** How big one of these is, in the stat's unit (metres, kN or kg). */
  amount: number;
  /** "a jumbo jet": used when the value rounds to one of them. */
  one: string;
  /** "jumbo jets": used after a number, e.g. "7 jumbo jets". */
  many: string;
}

/** A value must be at least this fraction of a reference to be compared with it. */
const MIN_RATIO = 0.75;

// ---------------------------------------------------------------------------
// Reference figures. Each value is a round, typical figure; sources in comments.
// ---------------------------------------------------------------------------

/** Floor-to-floor height of one storey: 3.5 m. Typical buildings run from about
 *  3.1 m (apartments) to 3.9 m (offices), per the CTBUH height calculator. */
const STOREY_M = 3.5;
/** Rockets shorter than two storeys are compared with people instead. */
const BUILDING_MIN_M = STOREY_M * 2;
/** A standing adult: 1.7 m. */
const PERSON_M = 1.7;

const THRUST_LADDER: readonly Reference[] = [
  // Boeing 747-400 ("jumbo jet"): 4 Pratt & Whitney PW4062 engines at about 282 kN
  // (63,300 lbf) each = about 1,130 kN total takeoff thrust.
  { amount: 1130, one: 'a jumbo jet', many: 'jumbo jets' },
  // Boeing 737-800: 2 CFM56-7B27 engines at about 121 kN (27,300 lbf) each = 242 kN.
  { amount: 242, one: 'a Boeing 737', many: 'Boeing 737s' },
  // Cessna Citation CJ4 business jet: 2 Williams FJ44-4A at about 16 kN each = 32 kN.
  { amount: 32, one: 'a small business jet', many: 'small business jets' },
];

const MASS_LADDER: readonly Reference[] = [
  // Adult male African bush elephant: about 6,000 kg (bulls range roughly 5-7 t).
  { amount: 6000, one: 'an elephant', many: 'elephants' },
  // A mid-size car: about 1,500 kg.
  { amount: 1500, one: 'a car', many: 'cars' },
  // An adult person: about 70 kg.
  { amount: 70, one: 'an adult', many: 'adults' },
  // A heavy bowling ball: 16 lb = 7.26 kg, rounded to 7 kg.
  { amount: 7, one: 'a bowling ball', many: 'bowling balls' },
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/**
 * Rounds a count to a number a person would say out loud.
 * Small counts stay exact (7), bigger ones snap to fives (63 -> 65),
 * because "about 63 jumbo jets" pretends to a precision we do not have.
 */
export function friendlyRound(count: number): number {
  if (count < 1.5) return 1;
  if (count <= 20) return Math.round(count);
  if (count < 100) return Math.round(count / 5) * 5;
  return Math.round(count / 10) * 10;
}

/** "a" or "an" before a number written in digits: an 8-, an 11-, an 18-, an 80-... */
function articleForNumber(n: number): 'a' | 'an' {
  if (n === 11 || n === 18) return 'an';
  return String(n).startsWith('8') ? 'an' : 'a';
}

/** 1 -> "first", 2 -> "2nd", 11 -> "11th", 21 -> "21st", 112 -> "112th". */
export function ordinal(n: number): string {
  if (n === 1) return 'first';
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/** "1 launch", "646 launches". */
export function plural(count: number, one: string, many: string): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? one : many}`;
}

/** Walks down a ladder (biggest first) and phrases the value against the first fit. */
function compareOnLadder(value: number, ladder: readonly Reference[], verb: string): string {
  for (const ref of ladder) {
    const ratio = value / ref.amount;
    if (ratio >= MIN_RATIO) {
      const count = friendlyRound(ratio);
      return count === 1 ? `about ${ref.one}` : `${verb} ${count} ${ref.many}`;
    }
  }
  // Smaller than even the last rung: say so instead of "about 0 bowling balls".
  return `less than ${ladder[ladder.length - 1].one}`;
}

/** Treats null, zero, negative and NaN alike: "nothing sensible to compare". */
function isUsable(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

// ---------------------------------------------------------------------------
// The three comparisons used by RocketFigure. Each returns null when the value
// is missing, so the caller can simply skip the line.
// ---------------------------------------------------------------------------

/** 70 -> "about a 20-storey building"; 4 -> "about 2 people stacked". */
export function compareHeight(heightM: number | null): string | null {
  if (!isUsable(heightM)) return null;
  if (heightM >= BUILDING_MIN_M) {
    const storeys = friendlyRound(heightM / STOREY_M);
    return `about ${articleForNumber(storeys)} ${storeys}-storey building`;
  }
  const people = friendlyRound(heightM / PERSON_M);
  return people === 1 ? "about a person's height" : `about ${people} people stacked`;
}

/** 7607 -> "roughly 7 jumbo jets"; 224 -> "about a Boeing 737". */
export function compareThrust(thrustKN: number | null): string | null {
  if (!isUsable(thrustKN)) return null;
  return compareOnLadder(thrustKN, THRUST_LADDER, 'roughly');
}

/** 22800 -> "about 4 elephants"; 300 -> "about 4 adults". */
export function compareMass(massKg: number | null): string | null {
  if (!isUsable(massKg)) return null;
  return compareOnLadder(massKg, MASS_LADDER, 'about');
}
