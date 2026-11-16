import type { Locale } from '@/lib/locale';
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
function buildStats(weather: Weather, locale: Locale): Stat[] {
  const chinese = locale === 'zh-Hans';
  const stats: Stat[] = [];
  if (weather.windKmh !== null) {
    const direction = weather.windDirectionDeg === null ? '' : ` ${degreesToCompass(weather.windDirectionDeg, locale)}`;
    stats.push({ label: chinese ? '风速' : 'Wind', value: String(Math.round(weather.windKmh)), unit: `km/h${direction}` });
  }
  if (weather.visibilityKm !== null) {
    stats.push({ label: chinese ? '能见度' : 'Visibility', value: String(Math.round(weather.visibilityKm)), unit: 'km' });
  }
  if (weather.cloudCoverPct !== null) {
    stats.push({ label: chinese ? '云量' : 'Cloud', value: String(Math.round(weather.cloudCoverPct)), unit: '%' });
  }
  if (weather.rainChancePct !== null) {
    stats.push({ label: chinese ? '降雨概率' : 'Rain', value: String(Math.round(weather.rainChancePct)), unit: chinese ? '%' : '% chance' });
  }
  return stats;
}

export function WeatherPanel({ weather, locale }: { weather: Weather | null; locale: Locale }) {
  const chinese = locale === 'zh-Hans';
  const title = chinese ? '发射场天气' : 'Weather at the pad';
  if (weather === null) {
    return (
      <Panel title={title}>
        <p className={styles.message}>
          {chinese ? '暂无预报。天气预报只覆盖未来约两周。' : 'No forecast yet. Forecasts only reach about two weeks ahead.'}
        </p>
      </Panel>
    );
  }

  const stats = buildStats(weather, locale);
  const hasTemperature = weather.temperatureC !== null;
  // A gust figure below the steady wind speed adds nothing (and looks like an error), so skip it.
  const hasGusts = weather.gustKmh !== null && (weather.windKmh === null || weather.gustKmh > weather.windKmh);

  if (stats.length === 0 && !hasTemperature && !hasGusts) {
    return (
      <Panel title={title}>
        <p className={styles.message}>{chinese ? '此次发射暂无详细天气预报。' : 'No forecast details are available for this launch.'}</p>
      </Panel>
    );
  }

  return (
    <Panel title={title}>
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
            <dt>{chinese ? '气温' : 'Temperature'}</dt>
            <dd>{chinese ? '发射时 ' : ''}{Math.round(weather.temperatureC as number)} °C{chinese ? '' : ' at launch time'}</dd>
          </>
        )}
        {hasGusts && (
          <>
            <dt>{chinese ? '阵风' : 'Gusts'}</dt>
            <dd>{chinese ? '最高 ' : 'up to '}{Math.round(weather.gustKmh as number)} km/h</dd>
          </>
        )}
        <dt>{chinese ? '来源' : 'Source'}</dt>
        <dd>{chinese ? 'Open-Meteo 天气预报' : 'Open-Meteo forecast'}</dd>
      </dl>
    </Panel>
  );
}
