import type { Locale } from '@/lib/locale';
import { hasLiftedOff } from '@/lib/status';
import type { Launch } from '@/lib/types';
import { Hero } from './Hero';
import { MediaLinks } from './MediaLinks';
import { MissionSection } from './MissionSection';
import { RocketSection } from './RocketSection';
import { WeatherPanel } from './WeatherPanel';
import styles from './LaunchDetail.module.css';

/** The full layout for one launch: hero plus the weather, mission, rocket and media panels. */
export function LaunchDetail({ launch, eyebrow, locale }: { launch: Launch; eyebrow: string; locale: Locale }) {
  return (
    <>
      <Hero launch={launch} eyebrow={eyebrow} locale={locale} />
      <div className={styles.panels}>
        {/* A forecast is meaningless once the rocket has left the pad. */}
        {!hasLiftedOff(launch.status) && <WeatherPanel weather={launch.weather} locale={locale} />}
        <MissionSection launch={launch} locale={locale} />
        <RocketSection launch={launch} locale={locale} />
        <MediaLinks launch={launch} locale={locale} />
      </div>
    </>
  );
}
