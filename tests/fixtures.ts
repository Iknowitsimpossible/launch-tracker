import type { Launch } from '../src/lib/types';

/**
 * One complete, made-up launch. Tests override only the fields they care about,
 * so each test reads as "a normal launch, except ...".
 *
 * It is written out by hand rather than read from data/launches.json because
 * that file is replaced by fresh data every hour.
 */
export function makeLaunch(overrides: Partial<Launch> = {}): Launch {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'falcon-9-block-5-test-mission',
    name: 'Test Mission',
    net: '2026-11-18T03:14:00Z',
    netPrecision: 'exact',
    windowStart: '2026-11-18T03:14:00Z',
    windowEnd: '2026-11-18T05:00:00Z',
    status: 'go',
    statusLabel: 'Go for Launch',
    failReason: null,
    image: null,
    provider: { name: 'SpaceX', abbrev: 'SpX', type: 'Commercial', countryCode: 'US' },
    rocket: {
      name: 'Falcon 9',
      fullName: 'Falcon 9 Block 5',
      description: null,
      heightM: 70,
      diameterM: 3.7,
      liftoffThrustKN: 7607,
      leoCapacityKg: 22800,
      reusable: true,
      successfulLaunches: 500,
      totalLaunches: 502,
    },
    booster: null,
    landing: null,
    mission: {
      description: null,
      type: 'Communications',
      payloadKind: 'communications',
      orbit: { name: 'Low Earth Orbit', abbrev: 'LEO' },
      orbitKind: 'low_earth',
    },
    crew: [],
    spacecraft: null,
    pad: {
      name: 'Space Launch Complex 4E',
      locationName: 'Vandenberg SFB, CA, USA',
      countryCode: 'US',
      latitude: 34.632,
      longitude: -120.611,
      timezone: 'America/Los_Angeles',
    },
    weather: null,
    webcasts: [],
    infoLinks: [],
    latestUpdate: null,
    ...overrides,
  };
}
