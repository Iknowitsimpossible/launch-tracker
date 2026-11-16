/**
 * The scheduled data job: downloads launches from Launch Library 2 and weather
 * from Open-Meteo, reshapes them into the contract in src/lib/types.ts, and
 * writes data/launches.json.
 *
 *   node scripts/fetch-launches.ts [--out <path>]
 *
 * Environment:
 *   LL_BASE_URL  Launch Library base URL. Defaults to production, which allows
 *                only 15 requests per hour. Use https://lldev.thespacedevs.com/2.3.0
 *                while developing.
 *
 * Why this is one file: Node runs TypeScript directly only if relative imports
 * end in ".ts", but the repo's tsconfig does not enable
 * `allowImportingTsExtensions`, so `tsc --noEmit` rejects such imports. Type-only
 * imports are fine (Node erases them before running), which is how we use the
 * contract below. The sections are ordered top-down: config, API shapes,
 * mapping tables, mapping, weather, contract check, file writing, main.
 */
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import type {
  Booster,
  CrewMember,
  Landing,
  LandingKind,
  Launch,
  LaunchData,
  LaunchImage,
  LaunchStatus,
  Link,
  Mission,
  OrbitKind,
  Pad,
  PayloadKind,
  Provider,
  Rocket,
  Spacecraft,
  Weather,
} from '../src/lib/types.ts';

// ─── Configuration ────────────────────────────────────────────────────────────

const PRODUCTION_LAUNCH_LIBRARY_URL = 'https://ll.thespacedevs.com/2.3.0';
const LAUNCH_LIBRARY_BASE_URL = (process.env.LL_BASE_URL || PRODUCTION_LAUNCH_LIBRARY_URL).replace(/\/+$/, '');

/** The job runs hourly against a 15/hour limit, so one run may use at most 4
 *  requests (retries included) to leave room for re-runs. */
const MAX_LAUNCH_LIBRARY_REQUESTS = 4;
const DAYS_AHEAD = 30;
const DAYS_BACK = 30;
const UPCOMING_LIMIT = 25;
/** 100 is the API's maximum page size; a month holds roughly 25-35 launches. */
const RECENT_PAGE_SIZE = 100;
/** Detailed pages are 3-4 MB and the API is sometimes slow. */
const LAUNCH_LIBRARY_TIMEOUT_MS = 90_000;
const RETRY_DELAY_MS = 5_000;

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
/** Open-Meteo forecasts today plus 15 more days (UTC); later hours are rejected. */
const FORECAST_HORIZON_DAYS = 16;
const WEATHER_TIMEOUT_MS = 30_000;
const WEATHER_VARIABLES = [
  'temperature_2m',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
  'visibility',
  'cloud_cover',
  'precipitation_probability',
] as const;

const DEFAULT_OUT_PATH = 'data/launches.json';

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

// ─── Launch Library response shapes (only the fields we read) ─────────────────
// These describe what we EXPECT. The data is untrusted, so every leaf value is
// still checked with the small helpers below before it is used.

interface ApiPage {
  count?: number;
  next?: string | null;
  results?: unknown;
}

interface ApiNamedThing {
  id?: number;
  name?: string;
  abbrev?: string;
}

interface ApiCountry {
  alpha_2_code?: string;
}

interface ApiLaunch {
  id?: string;
  slug?: string;
  name?: string;
  net?: string;
  net_precision?: ApiNamedThing | null;
  window_start?: string | null;
  window_end?: string | null;
  status?: ApiNamedThing | null;
  failreason?: string | null;
  image?: { image_url?: string; thumbnail_url?: string; credit?: string | null } | null;
  launch_service_provider?: {
    name?: string;
    abbrev?: string;
    type?: { name?: string } | null;
    country?: ApiCountry[] | null;
  } | null;
  rocket?: {
    configuration?: ApiRocketConfiguration | null;
    launcher_stage?: ApiLauncherStage[] | null;
    spacecraft_stage?: ApiSpacecraftStage[] | null;
  } | null;
  mission?: {
    type?: string | null;
    description?: string | null;
    orbit?: { name?: string; abbrev?: string } | null;
  } | null;
  pad?: {
    name?: string;
    latitude?: number | null;
    longitude?: number | null;
    country?: ApiCountry | null;
    location?: { name?: string; timezone_name?: string | null } | null;
  } | null;
  vid_urls?: ApiLink[] | null;
  info_urls?: ApiLink[] | null;
  updates?: { comment?: string; created_on?: string }[] | null;
}

interface ApiRocketConfiguration {
  name?: string;
  full_name?: string;
  description?: string | null;
  length?: number | null;
  diameter?: number | null;
  to_thrust?: number | null;
  leo_capacity?: number | null;
  reusable?: boolean;
  successful_launches?: number | null;
  total_launch_count?: number | null;
}

interface ApiLauncherStage {
  type?: string;
  launcher_flight_number?: number | null;
  launcher?: { serial_number?: string; is_placeholder?: boolean } | null;
  landing?: {
    attempt?: boolean | null;
    success?: boolean | null;
    downrange_distance?: number | null;
    landing_location?: { name?: string } | null;
    type?: { abbrev?: string } | null;
  } | null;
}

interface ApiSpacecraftStage {
  destination?: string | null;
  spacecraft?: { name?: string } | null;
  launch_crew?: { role?: { role?: string } | null; astronaut?: { name?: string } | null }[] | null;
}

interface ApiLink {
  title?: string;
  url?: string;
  /** Video links only, e.g. "SpaceX". */
  publisher?: string | null;
  /** Site name, e.g. "youtube.com". */
  source?: string | null;
  /** Lower number = more important. */
  priority?: number;
}

// ─── Small helpers for untrusted values ───────────────────────────────────────

/** A non-empty, trimmed string, or null for anything else. */
function textOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** Like textOrNull, but a missing value is an error (the contract needs it). */
function requireText(value: unknown, what: string): string {
  const text = textOrNull(value);
  if (text === null) throw new Error(`Launch Library data is missing ${what}`);
  return text;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

/** Only http(s) links are kept, so a page can never be handed e.g. a "javascript:" URL. */
function httpUrlOrNull(value: unknown): string | null {
  const text = textOrNull(value);
  if (text === null) return null;
  try {
    const url = new URL(text);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

/** Formats a time as "2026-11-18T03:14:00Z" (UTC, no milliseconds). */
function toUtcIso(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function utcIsoOrNull(value: unknown): string | null {
  const text = textOrNull(value);
  if (text === null) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : toUtcIso(date);
}

/** Array.isArray plus dropping non-object items, so mapping code can use `?.` safely. */
function listOf<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'object' && item !== null) : [];
}

/** Table lookup that ignores inherited keys: an API string like "constructor"
 *  must not match Object.prototype.constructor. */
function lookup<V>(table: Record<string, V>, key: string | null, fallback: V): V {
  return key !== null && Object.hasOwn(table, key) ? table[key] : fallback;
}

// ─── Mapping tables (API value → contract value) ──────────────────────────────
// Keys are the values Launch Library really uses, taken from its /config/
// endpoints (mission_types, orbits, landing_types, net_precisions,
// launch_statuses) and checked against ~700 real launches.

/** Keyed by status.id, because ids are stable while names get reworded. */
const STATUS_BY_API_ID: Record<string, { status: LaunchStatus; label: string }> = {
  '1': { status: 'go', label: 'Go for launch' },
  '2': { status: 'tbd', label: 'To be determined' },
  '3': { status: 'success', label: 'Launch successful' },
  '4': { status: 'failure', label: 'Launch failure' },
  '5': { status: 'hold', label: 'On hold' },
  '6': { status: 'in_flight', label: 'In flight' },
  '7': { status: 'partial_failure', label: 'Partial failure' },
  '8': { status: 'tbc', label: 'To be confirmed' },
  '9': { status: 'success', label: 'Payload deployed' }, // a success with extra confirmation
};

/** Keyed by net_precision.abbrev. A null precision (seen on far-future launches) → 'approximate'. */
const NET_PRECISION_BY_ABBREV: Record<string, Launch['netPrecision']> = {
  SEC: 'exact',
  MIN: 'exact',
  HR: 'exact',
  AM: 'day', // "in the morning, local time": the day is known, the time is not
  PM: 'day',
  DAY: 'day',
  WK: 'approximate',
  M: 'approximate',
  Q1: 'approximate',
  Q2: 'approximate',
  Q3: 'approximate',
  Q4: 'approximate',
  H1: 'approximate',
  H2: 'approximate',
  Y: 'approximate',
  FY: 'approximate',
  DEC: 'approximate',
};

/** Keyed by mission.type. Anything unlisted (including "Unknown" and "") → 'other'.
 *  A launch with crew aboard is always 'crew', whatever this table says. */
const PAYLOAD_KIND_BY_MISSION_TYPE: Record<string, PayloadKind> = {
  // Crewed programmes. Caveat: a few uncrewed launches carry this type too
  // (e.g. the Haven-1 station module, HLS demo flights), but most are crewed
  // flights whose crew list is simply not published yet.
  'Human Exploration': 'crew',
  Tourism: 'crew',
  Resupply: 'cargo',
  Communications: 'communications',
  'Earth Science': 'earth_observation',
  Navigation: 'navigation',
  'Planetary Science': 'science',
  Astrophysics: 'science',
  Heliophysics: 'science',
  'Robotic Exploration': 'science',
  'Lunar Exploration': 'science',
  'Materials Science': 'science',
  Biology: 'science',
  'Government/Top Secret': 'classified',
  'Test Flight': 'test',
  'Test Target': 'test',
  Technology: 'test', // technology demonstrators
  // Deliberately 'other': Dedicated Rideshare (mixed payloads), Suborbital,
  // Space Situational Awareness, Mission Extension, Unknown.
};

/** Keyed by mission.orbit.abbrev. Unlisted → 'unknown'. */
const ORBIT_KIND_BY_ABBREV: Record<string, OrbitKind> = {
  LEO: 'low_earth',
  PO: 'polar',
  SSO: 'polar',
  'Direct-GEO': 'geostationary',
  GTO: 'geostationary',
  GSO: 'geostationary',
  GSTO: 'geostationary',
  'Super-GTO': 'geostationary',
  'Enhanced-GTO': 'geostationary',
  LO: 'lunar',
  'Lunar flyby': 'lunar',
  'Lunar Impactor': 'lunar',
  Mars: 'deep_space',
  'Mars flyby': 'deep_space',
  Venus: 'deep_space',
  'Venus flyby': 'deep_space',
  'Mercury flyby': 'deep_space',
  'Jupiter Orbit': 'deep_space',
  Asteroid: 'deep_space',
  'Helio-N/A': 'deep_space',
  'Solar Esc.': 'deep_space',
  'L1-point': 'deep_space', // Sun-Earth Lagrange points, ~1.5 million km out
  L2: 'deep_space',
  Sub: 'suborbital',
  // No matching kind in the contract, so 'unknown': MEO (GPS, Glonass, Galileo),
  // HEO, Elliptical, EET (Earth entry trajectory), N/A.
};

/** Keyed by landing.type.abbrev, used only when a landing is attempted
 *  (no attempt always means 'expended'). Unlisted → 'other'. */
const LANDING_KIND_BY_TYPE: Record<string, LandingKind> = {
  ASDS: 'droneship', // autonomous spaceport drone ship
  RTLS: 'landing_pad', // return to launch site
  VL: 'landing_pad', // vertical landing on land, e.g. "Zhuque-3 Landing Site"
  Ocean: 'ocean', // controlled splashdown
  EXP: 'expended',
  ATM: 'expended', // destructive re-entry
  // Deliberately 'other': HL (runway), HC (helicopter catch), PCL (parachute),
  // PFL (parafoil).
};

// ─── Launch Library client ────────────────────────────────────────────────────

class LaunchLibraryClient {
  requestsMade = 0;
  // Plain fields rather than `constructor(private x)` shorthand: Node's type
  // stripping only removes types and cannot run that shorthand.
  private readonly baseUrl: URL;
  private readonly maxRequests: number;

  constructor(baseUrl: string, maxRequests: number) {
    this.maxRequests = maxRequests;
    this.baseUrl = new URL(baseUrl);
    if (this.baseUrl.protocol !== 'https:') throw new Error(`LL_BASE_URL must be https: ${baseUrl}`);
  }

  urlFor(path: string, params: Record<string, string>): URL {
    const url = new URL(`${this.baseUrl.href.replace(/\/+$/, '')}${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return url;
  }

  /** Fetches one page. Retries once on a network error or 5xx, but only while
   *  the request budget allows. A 429 (rate limited) is never retried. */
  async getPage(url: URL): Promise<{ launches: ApiLaunch[]; next: URL | null }> {
    // Pagination links come from the response. Only follow them to our own
    // host, so the API can never send this job somewhere else.
    if (url.origin !== this.baseUrl.origin) throw new Error(`Refusing to fetch from unexpected host: ${url.origin}`);

    for (;;) {
      if (this.requestsMade >= this.maxRequests) {
        throw new Error(`Launch Library request budget (${this.maxRequests} per run) used up`);
      }
      this.requestsMade++;
      let response: Response;
      try {
        response = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(LAUNCH_LIBRARY_TIMEOUT_MS),
        });
      } catch (error) {
        if (this.requestsMade < this.maxRequests) {
          console.warn(`Launch Library request failed (${errorMessage(error)}); retrying once`);
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        throw new Error(`Launch Library request failed: ${errorMessage(error)}`);
      }

      if (response.status === 429) {
        throw new Error(`Launch Library rate limit reached (HTTP 429). ${await response.text().catch(() => '')}`.trim());
      }
      if (response.status >= 500 && this.requestsMade < this.maxRequests) {
        console.warn(`Launch Library answered HTTP ${response.status}; retrying once`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      if (!response.ok) throw new Error(`Launch Library answered HTTP ${response.status} for ${url.pathname}`);

      return parsePage(await response.text(), url);
    }
  }
}

function parsePage(body: string, url: URL): { launches: ApiLaunch[]; next: URL | null } {
  let page: ApiPage;
  try {
    page = JSON.parse(body) as ApiPage;
  } catch {
    throw new Error(`Launch Library returned something that is not JSON for ${url.pathname}`);
  }
  if (typeof page !== 'object' || page === null || !Array.isArray(page.results)) {
    throw new Error(`Launch Library response for ${url.pathname} has no "results" list`);
  }
  const launches = page.results.filter((item): item is ApiLaunch => typeof item === 'object' && item !== null);
  const nextText = textOrNull(page.next);
  return { launches, next: nextText === null ? null : new URL(nextText) };
}

/** Upcoming launches in the next DAYS_AHEAD days, soonest first: one request. */
async function fetchUpcomingLaunches(client: LaunchLibraryClient, now: Date): Promise<ApiLaunch[]> {
  const until = new Date(now.getTime() + DAYS_AHEAD * MS_PER_DAY);
  const url = client.urlFor('/launches/upcoming/', {
    format: 'json',
    mode: 'detailed',
    limit: String(UPCOMING_LIMIT),
    ordering: 'net',
    net__lte: toUtcIso(until),
  });
  const { launches } = await client.getPage(url);
  return launches;
}

/** Launches from the past DAYS_BACK days, most recent first. Normally one
 *  request; follows the next page only while the window is not yet covered. */
async function fetchRecentLaunches(client: LaunchLibraryClient, now: Date): Promise<ApiLaunch[]> {
  const since = new Date(now.getTime() - DAYS_BACK * MS_PER_DAY);
  let url: URL | null = client.urlFor('/launches/previous/', {
    format: 'json',
    mode: 'detailed',
    limit: String(RECENT_PAGE_SIZE),
    ordering: '-net',
    net__gte: toUtcIso(since),
  });
  const launches: ApiLaunch[] = [];
  while (url !== null) {
    const page = await client.getPage(url);
    launches.push(...page.launches);
    const oldestNet = utcIsoOrNull(page.launches.at(-1)?.net);
    const windowCovered = oldestNet === null || oldestNet < toUtcIso(since);
    url = windowCovered ? null : page.next;
  }
  return launches;
}

// ─── Mapping one API launch onto the contract ─────────────────────────────────

/** Maps everything except `slug` uniqueness and `weather`, which need the
 *  whole list and are filled in afterwards. */
function mapLaunch(raw: ApiLaunch): Launch {
  const id = requireText(raw.id, 'a launch id');
  try {
    const fullName = requireText(raw.name, 'name');
    const crew = mapCrew(raw);
    const { status, statusLabel } = mapStatus(raw.status);
    const coreStage = pickCoreStage(raw);

    return {
      id,
      slug: slugify(textOrNull(raw.slug) ?? fullName) || id,
      name: missionNameFrom(fullName),
      net: requireUtcIso(raw.net, 'net'),
      netPrecision: raw.net_precision
        ? lookup(NET_PRECISION_BY_ABBREV, textOrNull(raw.net_precision.abbrev), 'approximate')
        : 'approximate',
      windowStart: utcIsoOrNull(raw.window_start),
      windowEnd: utcIsoOrNull(raw.window_end),
      status,
      statusLabel,
      // failreason is "" when there is none; only meaningful for failures.
      failReason: status === 'failure' || status === 'partial_failure' ? textOrNull(raw.failreason) : null,
      image: mapImage(raw.image),
      provider: mapProvider(raw.launch_service_provider),
      rocket: mapRocket(raw.rocket?.configuration),
      booster: mapBooster(coreStage),
      landing: mapLanding(coreStage?.landing),
      mission: mapMission(raw.mission, crew),
      crew,
      spacecraft: mapSpacecraft(firstSpacecraftStage(raw)),
      pad: mapPad(raw.pad),
      weather: null,
      webcasts: mapLinks(raw.vid_urls, (link) => textOrNull(link.publisher) ?? textOrNull(link.source)),
      infoLinks: mapLinks(raw.info_urls, (link) => textOrNull(link.source)),
      latestUpdate: mapLatestUpdate(raw.updates),
    };
  } catch (error) {
    throw new Error(`launch ${id}: ${errorMessage(error)}`);
  }
}

/** "Falcon 9 Block 5 | USSF-317" → "USSF-317". */
function missionNameFrom(fullName: string): string {
  const barIndex = fullName.indexOf('|');
  if (barIndex === -1) return fullName;
  return fullName.slice(barIndex + 1).trim() || fullName;
}

function requireUtcIso(value: unknown, what: string): string {
  const iso = utcIsoOrNull(value);
  if (iso === null) throw new Error(`missing or invalid ${what}`);
  return iso;
}

/** "Falcon 9 Block 5 | USSF-317" → "falcon-9-block-5-ussf-317". */
function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // drop accents: "é" → "e"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

function mapStatus(rawStatus: ApiNamedThing | null | undefined): { status: LaunchStatus; statusLabel: string } {
  const apiId = numberOrNull(rawStatus?.id);
  const known = lookup<{ status: LaunchStatus; label: string } | null>(
    STATUS_BY_API_ID,
    apiId === null ? null : String(apiId),
    null,
  );
  if (known) return { status: known.status, statusLabel: known.label };
  // A status id we have never seen: show it as undecided rather than guess.
  console.warn(`Unknown Launch Library status id ${apiId}; using 'tbd'`);
  return { status: 'tbd', statusLabel: textOrNull(rawStatus?.name) ?? 'To be determined' };
}

function mapImage(rawImage: ApiLaunch['image']): LaunchImage | null {
  const url = httpUrlOrNull(rawImage?.image_url);
  if (url === null) return null;
  return {
    url,
    // Same photo at full size is better than no thumbnail at all.
    thumbnailUrl: httpUrlOrNull(rawImage?.thumbnail_url) ?? url,
    credit: textOrNull(rawImage?.credit),
  };
}

function mapProvider(rawProvider: ApiLaunch['launch_service_provider']): Provider {
  const countries = listOf(rawProvider?.country);
  return {
    name: requireText(rawProvider?.name, 'provider name'),
    abbrev: requireText(rawProvider?.abbrev, 'provider abbreviation'),
    type: textOrNull(rawProvider?.type?.name),
    // Multinational providers (ESA lists 23 countries) have no single country.
    countryCode: countries.length === 1 ? textOrNull(countries[0].alpha_2_code) : null,
  };
}

function mapRocket(config: ApiRocketConfiguration | null | undefined): Rocket {
  const reusable = booleanOrNull(config?.reusable);
  if (reusable === null) throw new Error('missing rocket.reusable');
  return {
    name: requireText(config?.name, 'rocket name'),
    fullName: requireText(config?.full_name, 'rocket full name'),
    description: textOrNull(config?.description),
    // Launch Library already uses metres, kilonewtons and kilograms here.
    heightM: numberOrNull(config?.length),
    diameterM: numberOrNull(config?.diameter),
    liftoffThrustKN: numberOrNull(config?.to_thrust),
    leoCapacityKg: numberOrNull(config?.leo_capacity),
    reusable,
    successfulLaunches: numberOrNull(config?.successful_launches),
    totalLaunches: numberOrNull(config?.total_launch_count),
  };
}

/** The first "Core" stage (Falcon Heavy also lists two "Strap-On Booster" stages). */
function pickCoreStage(raw: ApiLaunch): ApiLauncherStage | null {
  const stages = listOf(raw.rocket?.launcher_stage);
  return stages.find((stage) => stage.type === 'Core') ?? stages[0] ?? null;
}

function mapBooster(stage: ApiLauncherStage | null): Booster | null {
  // Before SpaceX assigns a booster, the API shows a placeholder like "Unknown F9".
  if (!stage?.launcher || stage.launcher.is_placeholder === true) return null;
  const serial = textOrNull(stage.launcher.serial_number);
  if (serial === null) return null;
  return { serial, flightNumber: numberOrNull(stage.launcher_flight_number) };
}

function mapLanding(rawLanding: ApiLauncherStage['landing']): Landing | null {
  const attempted = booleanOrNull(rawLanding?.attempt);
  if (!rawLanding || attempted === null) return null;
  const locationName = textOrNull(rawLanding.landing_location?.name);
  return {
    attempted,
    success: booleanOrNull(rawLanding.success),
    kind: attempted ? lookup(LANDING_KIND_BY_TYPE, textOrNull(rawLanding.type?.abbrev), 'other') : 'expended',
    // The API writes the word "Unknown" instead of leaving the name empty.
    locationName: locationName === 'Unknown' ? null : locationName,
    downrangeKm: numberOrNull(rawLanding.downrange_distance),
  };
}

function firstSpacecraftStage(raw: ApiLaunch): ApiSpacecraftStage | null {
  return listOf(raw.rocket?.spacecraft_stage)[0] ?? null;
}

function mapCrew(raw: ApiLaunch): CrewMember[] {
  const crew: CrewMember[] = [];
  for (const member of listOf(firstSpacecraftStage(raw)?.launch_crew)) {
    const name = textOrNull(member.astronaut?.name);
    if (name !== null) crew.push({ name, role: textOrNull(member.role?.role) });
  }
  return crew;
}

function mapSpacecraft(stage: ApiSpacecraftStage | null): Spacecraft | null {
  const name = textOrNull(stage?.spacecraft?.name);
  if (name === null) return null;
  return { name, destination: textOrNull(stage?.destination) };
}

function mapMission(rawMission: ApiLaunch['mission'], crew: CrewMember[]): Mission {
  const type = textOrNull(rawMission?.type);
  const orbitName = textOrNull(rawMission?.orbit?.name);
  const orbitAbbrev = textOrNull(rawMission?.orbit?.abbrev);
  return {
    description: textOrNull(rawMission?.description),
    type,
    payloadKind: crew.length > 0 ? 'crew' : lookup(PAYLOAD_KIND_BY_MISSION_TYPE, type, 'other'),
    orbit: orbitName !== null && orbitAbbrev !== null ? { name: orbitName, abbrev: orbitAbbrev } : null,
    orbitKind: lookup(ORBIT_KIND_BY_ABBREV, orbitAbbrev, 'unknown'),
  };
}

function mapPad(rawPad: ApiLaunch['pad']): Pad {
  const latitude = numberOrNull(rawPad?.latitude);
  const longitude = numberOrNull(rawPad?.longitude);
  const coordinatesValid =
    latitude !== null && longitude !== null && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  return {
    name: requireText(rawPad?.name, 'pad name'),
    locationName: requireText(rawPad?.location?.name, 'pad location name'),
    countryCode: textOrNull(rawPad?.country?.alpha_2_code),
    latitude: coordinatesValid ? latitude : null,
    longitude: coordinatesValid ? longitude : null,
    timezone: textOrNull(rawPad?.location?.timezone_name),
  };
}

/** Sorted best first (lowest priority number); links that are not http(s) are dropped. */
function mapLinks(rawLinks: ApiLink[] | null | undefined, sourceOf: (link: ApiLink) => string | null): Link[] {
  const sorted = [...listOf(rawLinks)].sort(
    (a, b) => (numberOrNull(a.priority) ?? Infinity) - (numberOrNull(b.priority) ?? Infinity),
  );
  const links: Link[] = [];
  for (const rawLink of sorted) {
    const url = httpUrlOrNull(rawLink.url);
    if (url === null) continue;
    const source = sourceOf(rawLink);
    // A few info links have an empty title; the site name is the next best label.
    links.push({ title: textOrNull(rawLink.title) ?? source ?? url, url, source });
  }
  return links;
}

function mapLatestUpdate(rawUpdates: ApiLaunch['updates']): Launch['latestUpdate'] {
  let latest: Launch['latestUpdate'] = null;
  for (const update of listOf(rawUpdates)) {
    const comment = textOrNull(update.comment);
    const createdOn = utcIsoOrNull(update.created_on);
    if (comment === null || createdOn === null) continue;
    // ISO UTC strings in the same format sort correctly as plain text.
    if (latest === null || createdOn > latest.createdOn) latest = { comment, createdOn };
  }
  return latest;
}

/** Makes every slug unique across both lists by adding "-2", "-3", ... */
function makeSlugsUnique(launches: Launch[]): void {
  const used = new Set<string>();
  for (const launch of launches) {
    let candidate = launch.slug;
    for (let suffix = 2; used.has(candidate); suffix++) candidate = `${launch.slug}-${suffix}`;
    launch.slug = candidate;
    used.add(candidate);
  }
}

// ─── Weather (Open-Meteo) ─────────────────────────────────────────────────────

interface OpenMeteoLocation {
  hourly?: Record<string, unknown[] | undefined>;
}

/** The whole hour closest to the launch time, e.g. 03:14 → 03:00, 03:40 → 04:00. */
function nearestHour(isoTime: string): Date {
  return new Date(Math.round(new Date(isoTime).getTime() / MS_PER_HOUR) * MS_PER_HOUR);
}

/** "2026-11-18T03:00" — the format Open-Meteo uses for start_hour and its answers. */
function toOpenMeteoHour(date: Date): string {
  return date.toISOString().slice(0, 16);
}

function wantsWeather(launch: Launch, now: Date): boolean {
  if (launch.netPrecision !== 'exact') return false; // no time → no meaningful hour
  if (launch.pad.latitude === null || launch.pad.longitude === null) return false;
  const startOfTodayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const horizonEnd = startOfTodayUtc + FORECAST_HORIZON_DAYS * MS_PER_DAY;
  const hour = nearestHour(launch.net).getTime();
  return hour >= startOfTodayUtc && hour < horizonEnd;
}

/**
 * Fills `weather` for eligible launches using ONE request: Open-Meteo accepts
 * comma-separated lists of coordinates and of start/end hours, one entry per
 * location, and answers with a list in the same order.
 * Never throws: on any failure those launches keep `weather: null`.
 */
async function addWeather(launches: Launch[], now: Date): Promise<{ requestsMade: number; withWeather: number }> {
  const eligible = launches.filter((launch) => wantsWeather(launch, now));
  if (eligible.length === 0) return { requestsMade: 0, withWeather: 0 };

  const hours = eligible.map((launch) => toOpenMeteoHour(nearestHour(launch.net)));
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set('latitude', eligible.map((launch) => launch.pad.latitude).join(','));
  url.searchParams.set('longitude', eligible.map((launch) => launch.pad.longitude).join(','));
  url.searchParams.set('hourly', WEATHER_VARIABLES.join(','));
  url.searchParams.set('start_hour', hours.join(','));
  url.searchParams.set('end_hour', hours.join(','));
  url.searchParams.set('timezone', 'GMT');
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('wind_speed_unit', 'kmh');

  let locations: OpenMeteoLocation[];
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
    const body: unknown = await response.json();
    // One location comes back as a single object, several as a list.
    locations = (Array.isArray(body) ? body : [body]) as OpenMeteoLocation[];
    if (locations.length !== eligible.length) {
      throw new Error(`expected ${eligible.length} locations, got ${locations.length}`);
    }
  } catch (error) {
    console.warn(`Weather unavailable, continuing without it: ${errorMessage(error)}`);
    return { requestsMade: 1, withWeather: 0 };
  }

  let withWeather = 0;
  eligible.forEach((launch, index) => {
    launch.weather = readForecastHour(locations[index], hours[index]);
    if (launch.weather !== null) withWeather++;
  });
  return { requestsMade: 1, withWeather };
}

function readForecastHour(location: OpenMeteoLocation | null | undefined, expectedHour: string): Weather | null {
  const hourly = location?.hourly;
  // Make sure the answer really is for the hour we asked about.
  if (!hourly || !Array.isArray(hourly.time) || hourly.time[0] !== expectedHour) return null;
  const valueOf = (variable: (typeof WEATHER_VARIABLES)[number]) => numberOrNull(hourly[variable]?.[0]);
  const visibilityMetres = valueOf('visibility');
  return {
    forecastFor: `${expectedHour}:00Z`,
    temperatureC: valueOf('temperature_2m'),
    windKmh: valueOf('wind_speed_10m'),
    windDirectionDeg: valueOf('wind_direction_10m'),
    gustKmh: valueOf('wind_gusts_10m'),
    visibilityKm: visibilityMetres === null ? null : Math.round(visibilityMetres / 100) / 10,
    cloudCoverPct: valueOf('cloud_cover'),
    rainChancePct: valueOf('precipitation_probability'),
  };
}

// ─── Runtime contract check ───────────────────────────────────────────────────
// TypeScript already checks our mapping code against types.ts, but only at
// compile time. This checks the actual values right before writing, so bad
// API data can never reach the site. Each rule pushes a readable problem
// ("upcoming[3].pad.latitude: expected number or null") into a list.

type Rule = (value: unknown, path: string, problems: string[]) => void;

const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

const text: Rule = (value, path, problems) => {
  if (typeof value !== 'string' || value.trim() === '') problems.push(`${path}: expected a non-empty string`);
};
const number: Rule = (value, path, problems) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) problems.push(`${path}: expected a number`);
};
const boolean: Rule = (value, path, problems) => {
  if (typeof value !== 'boolean') problems.push(`${path}: expected true or false`);
};
const isoTime: Rule = (value, path, problems) => {
  if (typeof value !== 'string' || !ISO_UTC_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    problems.push(`${path}: expected a UTC time like 2026-11-18T03:14:00Z`);
  }
};
const httpUrl: Rule = (value, path, problems) => {
  if (typeof value !== 'string' || httpUrlOrNull(value) !== value) problems.push(`${path}: expected an http(s) URL`);
};

/** A `Record<Union, true>` must list every member of the union exactly once,
 *  so TypeScript tells us if these lists drift from types.ts. */
function oneOf<T extends string>(allowed: Record<T, true>): Rule {
  const values = Object.keys(allowed);
  return (value, path, problems) => {
    if (typeof value !== 'string' || !values.includes(value)) {
      problems.push(`${path}: expected one of ${values.join(', ')}, got ${JSON.stringify(value)}`);
    }
  };
}

function nullable(rule: Rule): Rule {
  return (value, path, problems) => {
    if (value !== null) rule(value, path, problems);
  };
}

function arrayOf(rule: Rule): Rule {
  return (value, path, problems) => {
    if (!Array.isArray(value)) return void problems.push(`${path}: expected a list`);
    value.forEach((item, index) => rule(item, `${path}[${index}]`, problems));
  };
}

/** Checks that exactly these keys are present (no missing, no extra ones). */
function object(fields: Record<string, Rule>): Rule {
  return (value, path, problems) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return void problems.push(`${path}: expected an object`);
    }
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (!Object.hasOwn(fields, key)) problems.push(`${path}.${key}: not in the contract`);
    }
    for (const [key, rule] of Object.entries(fields)) {
      if (!Object.hasOwn(record, key) || record[key] === undefined) problems.push(`${path}.${key}: missing`);
      else rule(record[key], `${path}.${key}`, problems);
    }
  };
}

const linkRule = object({ title: text, url: httpUrl, source: nullable(text) });

const launchRule = object({
  id: text,
  slug: (value, path, problems) => {
    if (typeof value !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) problems.push(`${path}: not URL-safe`);
  },
  name: text,
  net: isoTime,
  netPrecision: oneOf<Launch['netPrecision']>({ exact: true, day: true, approximate: true }),
  windowStart: nullable(isoTime),
  windowEnd: nullable(isoTime),
  status: oneOf<LaunchStatus>({
    go: true,
    tbc: true,
    tbd: true,
    hold: true,
    in_flight: true,
    success: true,
    partial_failure: true,
    failure: true,
  }),
  statusLabel: text,
  failReason: nullable(text),
  image: nullable(object({ url: httpUrl, thumbnailUrl: httpUrl, credit: nullable(text) })),
  provider: object({ name: text, abbrev: text, type: nullable(text), countryCode: nullable(text) }),
  rocket: object({
    name: text,
    fullName: text,
    description: nullable(text),
    heightM: nullable(number),
    diameterM: nullable(number),
    liftoffThrustKN: nullable(number),
    leoCapacityKg: nullable(number),
    reusable: boolean,
    successfulLaunches: nullable(number),
    totalLaunches: nullable(number),
  }),
  booster: nullable(object({ serial: text, flightNumber: nullable(number) })),
  landing: nullable(
    object({
      attempted: boolean,
      success: nullable(boolean),
      kind: oneOf<LandingKind>({ droneship: true, landing_pad: true, ocean: true, expended: true, other: true }),
      locationName: nullable(text),
      downrangeKm: nullable(number),
    }),
  ),
  mission: object({
    description: nullable(text),
    type: nullable(text),
    payloadKind: oneOf<PayloadKind>({
      crew: true,
      cargo: true,
      communications: true,
      earth_observation: true,
      navigation: true,
      science: true,
      classified: true,
      test: true,
      other: true,
    }),
    orbit: nullable(object({ name: text, abbrev: text })),
    orbitKind: oneOf<OrbitKind>({
      low_earth: true,
      polar: true,
      geostationary: true,
      lunar: true,
      deep_space: true,
      suborbital: true,
      unknown: true,
    }),
  }),
  crew: arrayOf(object({ name: text, role: nullable(text) })),
  spacecraft: nullable(object({ name: text, destination: nullable(text) })),
  pad: object({
    name: text,
    locationName: text,
    countryCode: nullable(text),
    latitude: nullable(number),
    longitude: nullable(number),
    timezone: nullable(text),
  }),
  weather: nullable(
    object({
      forecastFor: isoTime,
      temperatureC: nullable(number),
      windKmh: nullable(number),
      windDirectionDeg: nullable(number),
      gustKmh: nullable(number),
      visibilityKm: nullable(number),
      cloudCoverPct: nullable(number),
      rainChancePct: nullable(number),
    }),
  ),
  webcasts: arrayOf(linkRule),
  infoLinks: arrayOf(linkRule),
  latestUpdate: nullable(object({ comment: text, createdOn: isoTime })),
});

const launchDataRule = object({ generatedAt: isoTime, upcoming: arrayOf(launchRule), recent: arrayOf(launchRule) });

/** Throws with a list of problems if `data` does not match the contract. */
function assertMatchesContract(data: LaunchData): void {
  const problems: string[] = [];
  launchDataRule(data, 'data', problems);

  // Rules that span several launches.
  const all = [...data.upcoming, ...data.recent];
  for (const [field, values] of [
    ['slug', all.map((launch) => launch.slug)],
    ['id', all.map((launch) => launch.id)],
  ] as const) {
    const seen = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) problems.push(`duplicate ${field} "${value}"`);
      seen.add(value);
    }
  }
  const isSorted = (list: Launch[], direction: 1 | -1) =>
    list.every((launch, i) => i === 0 || direction * launch.net.localeCompare(list[i - 1].net) >= 0);
  if (!isSorted(data.upcoming, 1)) problems.push('upcoming is not soonest-first');
  if (!isSorted(data.recent, -1)) problems.push('recent is not most-recent-first');

  if (problems.length > 0) {
    const shown = problems.slice(0, 25).map((problem) => `  - ${problem}`).join('\n');
    const more = problems.length > 25 ? `\n  ...and ${problems.length - 25} more` : '';
    throw new Error(`Output does not match src/lib/types.ts:\n${shown}${more}`);
  }
}

// ─── Writing the file ─────────────────────────────────────────────────────────

/** Writes to a temporary file next to the target, then renames it into place.
 *  A rename on the same disk is atomic, so a reader never sees half a file. */
async function writeJsonAtomically(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, path);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function readOutPath(): string {
  const { values } = parseArgs({ options: { out: { type: 'string', default: DEFAULT_OUT_PATH } } });
  return resolve(values.out);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}

async function main(): Promise<void> {
  const outPath = readOutPath();
  const now = new Date();
  const client = new LaunchLibraryClient(LAUNCH_LIBRARY_BASE_URL, MAX_LAUNCH_LIBRARY_REQUESTS);
  console.log(`Launch Library: ${LAUNCH_LIBRARY_BASE_URL}`);

  // Any Launch Library failure throws here, before anything is written.
  const rawUpcoming = await fetchUpcomingLaunches(client, now);
  const rawRecent = await fetchRecentLaunches(client, now);

  // Re-apply the windows and order ourselves: the API silently ignores filter
  // names it does not know, and the contract promises these exact rules.
  const upcomingUntil = toUtcIso(new Date(now.getTime() + DAYS_AHEAD * MS_PER_DAY));
  const recentSince = toUtcIso(new Date(now.getTime() - DAYS_BACK * MS_PER_DAY));
  // The API keeps a launch in its "upcoming" list for about a day after liftoff,
  // and a launch can sit in both lists at once. So pool everything, drop
  // duplicates by id, and decide which list each launch belongs in from its
  // status: once it has an outcome it is "recent", whatever list it came from.
  const launchesById = new Map<string, Launch>();
  for (const launch of [...rawUpcoming, ...rawRecent].map(mapLaunch)) {
    if (!launchesById.has(launch.id)) launchesById.set(launch.id, launch);
  }
  const allLaunches = [...launchesById.values()];
  const hasOutcome = (launch: Launch) =>
    launch.status === 'success' || launch.status === 'failure' || launch.status === 'partial_failure';

  const upcoming = allLaunches
    .filter((launch) => !hasOutcome(launch) && launch.net <= upcomingUntil)
    .sort((a, b) => a.net.localeCompare(b.net))
    .slice(0, UPCOMING_LIMIT);
  const recent = allLaunches
    .filter((launch) => hasOutcome(launch) && launch.net >= recentSince)
    .sort((a, b) => b.net.localeCompare(a.net));
  makeSlugsUnique([...upcoming, ...recent]);

  const weather = await addWeather(upcoming, now);

  const data: LaunchData = { generatedAt: toUtcIso(now), upcoming, recent };
  assertMatchesContract(data);
  await writeJsonAtomically(outPath, data);

  console.log(
    [
      `Wrote ${outPath}`,
      `  upcoming: ${upcoming.length}, recent: ${recent.length}`,
      `  Launch Library requests: ${client.requestsMade} (max ${MAX_LAUNCH_LIBRARY_REQUESTS})`,
      `  Open-Meteo requests: ${weather.requestsMade}, launches with weather: ${weather.withWeather}`,
    ].join('\n'),
  );
}

main().catch((error: unknown) => {
  // Exit non-zero and leave the existing file untouched: stale data beats an empty site.
  console.error(`fetch-launches failed: ${errorMessage(error)}`);
  process.exitCode = 1;
});
