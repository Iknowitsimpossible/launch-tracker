import type { ReactNode } from 'react';
import type { CrewMember, Landing, Launch, Mission, OrbitKind, PayloadKind, LandingKind, Spacecraft } from '@/lib/types';
import { CrewDrawing } from './drawings/CrewDrawing';
import { DestinationDrawing } from './drawings/DestinationDrawing';
import { LandingDrawing } from './drawings/LandingDrawing';
import { PayloadDrawing } from './drawings/PayloadDrawing';
import styles from './MissionPlates.module.css';

/**
 * The row of small line drawings in the Mission section:
 * destination, crew, payload and landing.
 *
 * A pure function of the launch (no hooks, no 'use client'), so it renders on
 * the server. All the wording decisions live in the small helpers below; the
 * component itself just lines up the plates.
 */
export function MissionPlates({ launch }: { launch: Launch }) {
  const commanderIndex = findCommanderIndex(launch.crew);

  return (
    <div className={styles.plates}>
      <Plate
        drawing={<DestinationDrawing kind={launch.mission.orbitKind} />}
        label={destinationLabel(launch.mission)}
        caption={launch.spacecraft?.destination ?? 'Destination'}
      />
      <Plate
        drawing={<CrewDrawing crewCount={launch.crew.length} commanderIndex={commanderIndex} />}
        label={crewLabel(launch.crew)}
        caption={crewCaption(launch.crew, commanderIndex)}
      />
      <Plate
        drawing={<PayloadDrawing kind={launch.mission.payloadKind} />}
        label={PAYLOAD_NAMES[launch.mission.payloadKind]}
        caption={payloadCaption(launch.mission, launch.spacecraft)}
      />
      {/* No landing information published: leave the plate out rather than guess. */}
      {launch.landing && (
        <Plate
          drawing={<LandingDrawing kind={landingDrawingKind(launch.landing)} />}
          label={landingLabel(launch.landing)}
          caption={landingCaption(launch.landing)}
        />
      )}
    </div>
  );
}

function Plate({ drawing, label, caption }: { drawing: ReactNode; label: string; caption: string }) {
  return (
    <div className={styles.plate}>
      {drawing}
      <b className={styles.label}>{label}</b>
      <small className={styles.caption}>{caption}</small>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Destination
// ---------------------------------------------------------------------------

/** Plain-language names, used when the orbit's published name is missing. */
const ORBIT_NAMES: Record<OrbitKind, string> = {
  low_earth: 'Low Earth orbit',
  polar: 'Polar orbit',
  geostationary: 'Geostationary orbit',
  lunar: 'The Moon',
  deep_space: 'Deep space',
  suborbital: 'Suborbital hop',
  unknown: 'Orbit not published',
};

function destinationLabel(mission: Mission): string {
  // The API sometimes publishes an orbit literally named "Unknown"; our own wording reads better.
  if (mission.orbitKind === 'unknown') return ORBIT_NAMES.unknown;
  return mission.orbit?.name || ORBIT_NAMES[mission.orbitKind];
}

// ---------------------------------------------------------------------------
// Crew
// ---------------------------------------------------------------------------

/** Longest crew-name list we print in full; longer lists name only the commander. */
const MAX_NAMES_CAPTION_LENGTH = 48;

/** The commander is whoever's role says so; failing that, the first person listed. */
function findCommanderIndex(crew: CrewMember[]): number {
  const index = crew.findIndex((member) => member.role?.toLowerCase().includes('commander'));
  return index === -1 ? 0 : index;
}

function crewLabel(crew: CrewMember[]): string {
  if (crew.length === 0) return 'Uncrewed';
  return crew.length === 1 ? '1 astronaut' : `${crew.length} astronauts`;
}

/** "A, B and C" when that is short; otherwise "Commander and 3 others". */
function crewCaption(crew: CrewMember[], commanderIndex: number): string {
  if (crew.length === 0) return 'No astronauts aboard';

  const names = crew.map((member) => member.name);
  const fullList =
    names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  if (fullList.length <= MAX_NAMES_CAPTION_LENGTH) return fullList;

  const others = crew.length - 1;
  return `${names[commanderIndex]} and ${others} ${others === 1 ? 'other' : 'others'}`;
}

// ---------------------------------------------------------------------------
// Payload
// ---------------------------------------------------------------------------

const PAYLOAD_NAMES: Record<PayloadKind, string> = {
  crew: 'Crewed spacecraft',
  cargo: 'Cargo resupply',
  communications: 'Communications satellite',
  earth_observation: 'Earth-observing satellite',
  navigation: 'Navigation satellite',
  science: 'Science mission',
  classified: 'Classified payload',
  test: 'Test flight',
  other: 'Payload',
};

/**
 * The capsule's name for crew and cargo flights ("Crew Dragon Grace"); otherwise
 * the published mission type, but only when it says something the label does not
 * ("Communications" under "Communications satellite" would just repeat it).
 */
function payloadCaption(mission: Mission, spacecraft: Spacecraft | null): string {
  if (spacecraft && (mission.payloadKind === 'crew' || mission.payloadKind === 'cargo')) {
    return spacecraft.name;
  }
  const type = mission.type?.trim();
  const label = PAYLOAD_NAMES[mission.payloadKind].toLowerCase();
  if (type && type.toLowerCase() !== 'unknown' && !label.includes(type.toLowerCase())) {
    return type.replace(/\s*\/\s*/g, ' / '); // "Government/Top Secret" -> "Government / Top Secret"
  }
  // The "other" plate is already labelled "Payload", so say what is missing instead.
  return mission.payloadKind === 'other' ? 'Details not published' : 'Payload';
}

// ---------------------------------------------------------------------------
// Landing
// ---------------------------------------------------------------------------

/** No landing attempt means the booster is thrown away, whatever `kind` says. */
function landingDrawingKind(landing: Landing): LandingKind {
  return landing.attempted ? landing.kind : 'expended';
}

const LANDING_NAMES: Record<LandingKind, string> = {
  droneship: 'Lands on a droneship',
  landing_pad: 'Lands on a landing pad',
  ocean: 'Splashes down at sea',
  expended: 'Booster not recovered',
  other: 'Booster landing',
};

function landingLabel(landing: Landing): string {
  return LANDING_NAMES[landingDrawingKind(landing)];
}

/** `"Of Course I Still Love You", 574 km downrange. Landed successfully.` */
function landingCaption(landing: Landing): string {
  const kind = landingDrawingKind(landing);
  const where: string[] = [];
  if (landing.locationName) {
    // Ships have names, so quote them; a "Landing Zone 40" is just a place.
    where.push(kind === 'droneship' ? `"${landing.locationName}"` : landing.locationName);
  }
  if (landing.downrangeKm !== null && Number.isFinite(landing.downrangeKm)) {
    where.push(`${formatKm(landing.downrangeKm)} km downrange`);
  }

  let outcome = '';
  if (landing.attempted && landing.success === true) outcome = 'Landed successfully';
  if (landing.attempted && landing.success === false) outcome = 'Landing failed';

  const sentences = [where.join(', '), outcome].filter((part) => part !== '');
  if (sentences.length > 0) return sentences.join('. ');
  return kind === 'expended' ? 'Used once, no landing attempt' : 'Landing site not published';
}

/** 574 -> "574", 0.3 -> "0.3", 1234 -> "1,234". */
function formatKm(km: number): string {
  return km.toLocaleString('en-US', { maximumFractionDigits: km < 10 ? 1 : 0 });
}
