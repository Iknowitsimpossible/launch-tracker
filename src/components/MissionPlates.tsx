import type { Locale } from '@/lib/locale';
import type { ReactNode } from 'react';
import type { CrewMember, Landing, Launch, Mission, OrbitKind, PayloadKind, LandingKind, Spacecraft } from '@/lib/types';
import { CrewDrawing } from './drawings/CrewDrawing';
import { DestinationDrawing } from './drawings/DestinationDrawing';
import { LandingDrawing } from './drawings/LandingDrawing';
import { PayloadDrawing } from './drawings/PayloadDrawing';
import { localizeName } from '@/lib/translate';
import styles from './MissionPlates.module.css';

/**
 * The row of small line drawings in the Mission section:
 * destination, crew, payload and landing.
 *
 * A pure function of the launch (no hooks, no 'use client'), so it renders on
 * the server. All the wording decisions live in the small helpers below; the
 * component itself just lines up the plates.
 */
export function MissionPlates({ launch, locale }: { launch: Launch; locale: Locale }) {
  const chinese = locale === 'zh-Hans';
  const commanderIndex = findCommanderIndex(launch.crew);

  return (
    <div className={styles.plates}>
      <Plate
        drawing={<DestinationDrawing kind={launch.mission.orbitKind} locale={locale} />}
        label={destinationLabel(launch.mission, locale)}
        caption={spacecraftDestination(launch.spacecraft?.destination, locale)}
      />
      <Plate
        drawing={<CrewDrawing crewCount={launch.crew.length} commanderIndex={commanderIndex} locale={locale} />}
        label={crewLabel(launch.crew, locale)}
        caption={crewCaption(launch.crew, commanderIndex, locale)}
      />
      <Plate
        drawing={<PayloadDrawing kind={launch.mission.payloadKind} locale={locale} />}
        label={(chinese ? CHINESE_PAYLOADS : PAYLOAD_NAMES)[launch.mission.payloadKind]}
        caption={payloadCaption(launch.mission, launch.spacecraft, locale)}
      />
      {/* No landing information published: leave the plate out rather than guess. */}
      {launch.landing && (
        <Plate
          drawing={<LandingDrawing kind={landingDrawingKind(launch.landing)} locale={locale} />}
          label={(chinese ? CHINESE_LANDINGS : LANDING_NAMES)[landingDrawingKind(launch.landing)]}
          caption={landingCaption(launch.landing, locale)}
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

const CHINESE_ORBITS: Record<OrbitKind, string> = {
  low_earth: '近地轨道',
  polar: '极地轨道',
  geostationary: '地球静止轨道',
  lunar: '月球',
  deep_space: '深空',
  suborbital: '亚轨道飞行',
  unknown: '轨道未公布',
};

const CHINESE_ORBIT_NAMES = new Map([
  ['Low Earth Orbit', '近地轨道'],
  ['Medium Earth Orbit', '中地球轨道'],
  ['Polar Orbit', '极地轨道'],
  ['Sun-Synchronous Orbit', '太阳同步轨道'],
  ['Geostationary Transfer Orbit', '地球静止转移轨道'],
  ['Geostationary Orbit', '地球静止轨道'],
  ['Mars Orbit', '火星轨道'],
]);

function spacecraftDestination(name: string | null | undefined, locale: Locale): string {
  if (locale === 'en') return name ?? 'Destination';
  if (name === 'International Space Station') return '国际空间站';
  return name ? CHINESE_ORBIT_NAMES.get(name) ?? localizeName(name, locale) : '目的地';
}

function destinationLabel(mission: Mission, locale: Locale): string {
  if (locale === 'zh-Hans') {
    const name = mission.orbit?.name;
    if (name && name !== 'Unknown') return CHINESE_ORBIT_NAMES.get(name) ?? name;
    return CHINESE_ORBITS[mission.orbitKind];
  }
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

function crewLabel(crew: CrewMember[], locale: Locale): string {
  if (locale === 'zh-Hans') return crew.length === 0 ? '无人飞行' : `${crew.length} 名航天员`;
  if (crew.length === 0) return 'Uncrewed';
  return crew.length === 1 ? '1 astronaut' : `${crew.length} astronauts`;
}

/** "A, B and C" when that is short; otherwise "Commander and 3 others". */
function crewCaption(crew: CrewMember[], commanderIndex: number, locale: Locale): string {
  const chinese = locale === 'zh-Hans';
  if (crew.length === 0) return chinese ? '无航天员搭乘' : 'No astronauts aboard';

  const names = crew.map((member) => member.name);
  const fullList =
    chinese ? names.join('、') : names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  if ((chinese && names.length === 1) || fullList.length <= MAX_NAMES_CAPTION_LENGTH) return fullList;

  const others = crew.length - 1;
  if (chinese) return `${names[commanderIndex]} 等 ${crew.length} 人`;
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

const CHINESE_PAYLOADS: Record<PayloadKind, string> = {
  crew: '载人飞船',
  cargo: '货运补给',
  communications: '通信卫星',
  earth_observation: '对地观测卫星',
  navigation: '导航卫星',
  science: '科学任务',
  classified: '保密载荷',
  test: '试飞',
  other: '有效载荷',
};

const CHINESE_MISSION_TYPES = new Map([
  ['Government/Top Secret', '政府／绝密'],
  ['Resupply', '补给任务'],
  ['Human Exploration', '载人探索'],
  ['Technology', '技术验证'],
  ['Earth Science', '地球科学'],
  ['Dedicated Rideshare', '专用拼车发射'],
  ['Planetary Science', '行星科学'],
]);

/**
 * The capsule's name for crew and cargo flights ("Crew Dragon Grace"); otherwise
 * the published mission type, but only when it says something the label does not
 * ("Communications" under "Communications satellite" would just repeat it).
 */
function payloadCaption(mission: Mission, spacecraft: Spacecraft | null, locale: Locale): string {
  if (spacecraft && (mission.payloadKind === 'crew' || mission.payloadKind === 'cargo')) {
    return localizeName(spacecraft.name, locale);
  }
  const type = mission.type?.trim();
  const label = PAYLOAD_NAMES[mission.payloadKind].toLowerCase();
  if (type && type.toLowerCase() !== 'unknown' && !label.includes(type.toLowerCase())) {
    const formatted = type.replace(/\s*\/\s*/g, ' / ');
    return locale === 'zh-Hans' ? CHINESE_MISSION_TYPES.get(type) ?? formatted : formatted;
  }
  // The "other" plate is already labelled "Payload", so say what is missing instead.
  if (locale === 'zh-Hans') return mission.payloadKind === 'other' ? '详情未公布' : '有效载荷';
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

const CHINESE_LANDINGS: Record<LandingKind, string> = {
  droneship: '在无人回收船上着陆',
  landing_pad: '在陆上着陆区着陆',
  ocean: '在海上溅落',
  expended: '助推器不回收',
  other: '助推器着陆',
};

/** `"Of Course I Still Love You", 574 km downrange. Landed successfully.` */
function landingCaption(landing: Landing, locale: Locale): string {
  const chinese = locale === 'zh-Hans';
  const kind = landingDrawingKind(landing);
  const where: string[] = [];
  if (landing.locationName) {
    // Ships have names, so quote them; a "Landing Zone 40" is just a place.
    const place = localizeName(landing.locationName, locale);
    where.push(kind === 'droneship' ? `"${place}"` : place);
  }
  if (landing.downrangeKm !== null && Number.isFinite(landing.downrangeKm)) {
    const distance = formatKm(landing.downrangeKm);
    where.push(chinese ? `下程距离 ${distance} 公里` : `${distance} km downrange`);
  }

  let outcome = '';
  if (landing.attempted && landing.success === true) outcome = chinese ? '着陆成功' : 'Landed successfully';
  if (landing.attempted && landing.success === false) outcome = chinese ? '着陆失败' : 'Landing failed';

  const sentences = [where.join(chinese ? '，' : ', '), outcome].filter((part) => part !== '');
  if (sentences.length > 0) return sentences.join(chinese ? '。' : '. ');
  if (chinese) return kind === 'expended' ? '一次性使用，不尝试着陆' : '着陆地点未公布';
  return kind === 'expended' ? 'Used once, no landing attempt' : 'Landing site not published';
}

/** 574 -> "574", 0.3 -> "0.3", 1234 -> "1,234". */
function formatKm(km: number): string {
  return km.toLocaleString('en-US', { maximumFractionDigits: km < 10 ? 1 : 0 });
}
