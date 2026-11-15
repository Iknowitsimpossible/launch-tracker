/**
 * THE DATA CONTRACT.
 *
 * This file is the single agreement between the two halves of the project:
 *   - scripts/fetch-launches.ts PRODUCES data/launches.json in exactly this shape.
 *   - the pages and components CONSUME it and may rely on every field below.
 *
 * Rules that keep the contract honest:
 *   - Every field is always present. Missing information is `null` (or an empty
 *     array), never `undefined` and never an invented value.
 *   - All times are ISO 8601 strings in UTC, e.g. "2026-11-18T03:14:00Z".
 *     The browser converts them to the visitor's time zone.
 *   - Units are fixed and written into the field name (Km, Kg, KN, C, Pct).
 */

export interface LaunchData {
  /** When the fetch job produced this file (UTC). Shown in the footer. */
  generatedAt: string;
  /** Launches that have not happened yet, soonest first. */
  upcoming: Launch[];
  /** Launches from the past 30 days, most recent first. */
  recent: Launch[];
}

export interface Launch {
  /** Launch Library's id (a UUID). */
  id: string;
  /** URL-safe unique name, used for the page address: /launch/<slug>/ */
  slug: string;
  /** The mission's name on its own, e.g. "USSF-317" (not "Falcon 9 Block 5 | USSF-317"). */
  name: string;

  /** Planned or actual liftoff time ("NET" = no earlier than). */
  net: string;
  /** How much of `net` is real: 'exact' = to the minute or hour, 'day' = date known but
   *  not the time, 'approximate' = only the month/quarter/year is known. */
  netPrecision: 'exact' | 'day' | 'approximate';
  windowStart: string | null;
  windowEnd: string | null;

  status: LaunchStatus;
  /** Human wording for the status, e.g. "Go for launch", "To be confirmed". */
  statusLabel: string;
  /** Why it failed, when status is 'failure' or 'partial_failure' and a reason is published. */
  failReason: string | null;

  image: LaunchImage | null;
  provider: Provider;
  rocket: Rocket;
  /** The first-stage booster flying this launch, when it is known and tracked. */
  booster: Booster | null;
  /** How the booster comes back. `null` when nothing is published. */
  landing: Landing | null;
  mission: Mission;
  /** Astronauts aboard at launch. Empty array = uncrewed. */
  crew: CrewMember[];
  /** The crew or cargo capsule on top of the rocket, if there is one. */
  spacecraft: Spacecraft | null;
  pad: Pad;
  /** Forecast at the pad for the launch hour. `null` when the launch is too far
   *  away (beyond ~16 days), already happened, or the forecast call failed. */
  weather: Weather | null;
  /** Livestreams, best first. */
  webcasts: Link[];
  /** Official pages and articles about the launch. */
  infoLinks: Link[];
  /** The most recent schedule note, e.g. "Delayed to NET November 17 PST." */
  latestUpdate: { comment: string; createdOn: string } | null;
}

export type LaunchStatus =
  | 'go' // date and time confirmed
  | 'tbc' // date awaiting confirmation
  | 'tbd' // date is a placeholder
  | 'hold' // countdown paused
  | 'in_flight'
  | 'success'
  | 'partial_failure'
  | 'failure';

export interface LaunchImage {
  url: string;
  thumbnailUrl: string;
  /** Photographer or agency to credit next to the photo. */
  credit: string | null;
}

export interface Provider {
  name: string; // "SpaceX"
  abbrev: string; // "SpX"
  /** "Commercial", "Government", ... as published. */
  type: string | null;
  /** Two-letter country code, e.g. "US". */
  countryCode: string | null;
}

export interface Rocket {
  name: string; // "Falcon 9"
  fullName: string; // "Falcon 9 Block 5"
  description: string | null;
  heightM: number | null;
  diameterM: number | null;
  liftoffThrustKN: number | null;
  /** Payload it can carry to low Earth orbit. */
  leoCapacityKg: number | null;
  reusable: boolean;
  successfulLaunches: number | null;
  totalLaunches: number | null;
}

export interface Booster {
  serial: string; // "B1100"
  /** 1 for a brand-new booster, 11 for its 11th flight. */
  flightNumber: number | null;
}

export interface Landing {
  /** false = the booster is thrown away (no landing attempt). */
  attempted: boolean;
  /** `null` until the launch has happened. */
  success: boolean | null;
  kind: LandingKind;
  /** e.g. "Of Course I Still Love You", "Landing Zone 40". */
  locationName: string | null;
  downrangeKm: number | null;
}

export type LandingKind = 'droneship' | 'landing_pad' | 'ocean' | 'expended' | 'other';

export interface Mission {
  description: string | null;
  /** The mission type as published, e.g. "Communications", "Government/Top Secret". */
  type: string | null;
  /** A small fixed set the drawings are keyed on. */
  payloadKind: PayloadKind;
  orbit: { name: string; abbrev: string } | null; // "Low Earth Orbit", "LEO"
  /** A small fixed set the drawings are keyed on. */
  orbitKind: OrbitKind;
}

export type PayloadKind =
  | 'crew'
  | 'cargo' // supplies to a space station
  | 'communications'
  | 'earth_observation'
  | 'navigation'
  | 'science' // astronomy, planetary probes, research
  | 'classified'
  | 'test' // test flight or demo payload
  | 'other';

export type OrbitKind =
  | 'low_earth'
  | 'polar' // polar and sun-synchronous orbits
  | 'geostationary' // GEO and transfer orbits towards it
  | 'lunar'
  | 'deep_space' // beyond the Moon: Mars, asteroids, the Sun
  | 'suborbital'
  | 'unknown';

export interface CrewMember {
  name: string;
  /** e.g. "Spacecraft Commander". */
  role: string | null;
}

export interface Spacecraft {
  name: string; // "Crew Dragon Grace"
  /** e.g. "International Space Station". */
  destination: string | null;
}

export interface Pad {
  name: string; // "Space Launch Complex 4E"
  /** e.g. "Vandenberg SFB, CA, USA". */
  locationName: string;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
  /** IANA zone of the pad, e.g. "America/Los_Angeles". */
  timezone: string | null;
}

export interface Weather {
  /** The forecast hour this describes (UTC), the one closest to `net`. */
  forecastFor: string;
  temperatureC: number | null;
  windKmh: number | null;
  /** Direction the wind blows FROM, in degrees (0 = north, 90 = east). */
  windDirectionDeg: number | null;
  gustKmh: number | null;
  visibilityKm: number | null;
  cloudCoverPct: number | null;
  rainChancePct: number | null;
}

export interface Link {
  title: string;
  url: string;
  /** Site or publisher, e.g. "X", "YouTube", "spacex.com". */
  source: string | null;
}
