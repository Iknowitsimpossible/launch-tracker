import { degreesToCompass } from '@/lib/compass';
import type { Weather } from '@/lib/types';
import { Panel } from './Panel';
import styles from './WeatherPanel.module.css';

interface Stat {
  label: string;
  value: string;
  unit: string;
}

/** Only the numbers that exist become tiles, so a missing value never shows as a blank or "null". */
function buildStats(weather: Weather): Stat[] {
  const stats: Stat[] = [];
  if (weather.windKmh !== null) {
    const direction = weather.windDirectionDeg === null ? '' : ` ${degreesToCompass(weather.windDirectionDeg)}`;
    stats.push({ label: 'Wind', value: String(Math.round(weather.windKmh)), unit: `km/h${direction}` });
  }
  if (weather.visibilityKm !== null) {
    stats.push({ label: 'Visibility', value: String(Math.round(weather.visibilityKm)), unit: 'km' });
  }
  if (weather.cloudCoverPct !== null) {
    stats.push({ label: 'Cloud', value: String(Math.round(weather.cloudCoverPct)), unit: '%' });
  }
  if (weather.rainChancePct !== null) {
    stats.push({ label: 'Rain', value: String(Math.round(weather.rainChancePct)), unit: '% chance' });
  }
  return stats;
}

export function WeatherPanel({ weather }: { weather: Weather | null }) {
  if (weather === null) {
    return (
      <Panel title="Weather at the pad">
        <p className={styles.message}>No forecast yet. Forecasts only reach about two weeks ahead.</p>
      </Panel>
    );
  }

  const stats = buildStats(weather);
  const hasTemperature = weather.temperatureC !== null;
  // A gust figure below the steady wind speed adds nothing (and looks like an error), so skip it.
  const hasGusts = weather.gustKmh !== null && (weather.windKmh === null || weather.gustKmh > weather.windKmh);

  if (stats.length === 0 && !hasTemperature && !hasGusts) {
    return (
      <Panel title="Weather at the pad">
        <p className={styles.message}>No forecast details are available for this launch.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Weather at the pad">
      {stats.length > 0 && (
        <div className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <span className={styles.label}>{stat.label}</span>
              <b>{stat.value}</b>
              <small>{stat.unit}</small>
            </div>
          ))}
        </div>
      )}
      <dl className={styles.facts}>
        {hasTemperature && (
          <>
            <dt>Temperature</dt>
            <dd>{Math.round(weather.temperatureC as number)} °C at launch time</dd>
          </>
        )}
        {hasGusts && (
          <>
            <dt>Gusts</dt>
            <dd>up to {Math.round(weather.gustKmh as number)} km/h</dd>
          </>
        )}
        <dt>Source</dt>
        <dd>Open-Meteo forecast</dd>
      </dl>
    </Panel>
  );
}
