import type { Locale } from '@/lib/locale';
import { isHttpUrl } from '@/lib/links';
import { hasLiftedOff, isFinished } from '@/lib/status';
import type { Launch } from '@/lib/types';
import { AddToCalendarButton } from './AddToCalendarButton';
import { ButtonLink } from './ButtonLink';
import { Countdown } from './Countdown';
import { HeroPhoto } from './HeroPhoto';
import { LocalTime } from './LocalTime';
import { Outcome } from './Outcome';
import { StatusTag } from './StatusTag';
import styles from './Hero.module.css';

interface HeroProps {
  launch: Launch;
  locale: Locale;
  /** Small label above the title, e.g. "Next launch". */
  eyebrow: string;
}

export function Hero({ launch, eyebrow, locale }: HeroProps) {
  const chinese = locale === 'zh-Hans';
  const liftedOff = hasLiftedOff(launch.status);
  const watchLink = launch.webcasts.find((link) => isHttpUrl(link.url));
  const showCountdown = !liftedOff && launch.netPrecision === 'exact';
  // An all-day event is fine for a known date; a bare month cannot go in a calendar.
  const showCalendar = !liftedOff && launch.netPrecision !== 'approximate';

  return (
    <section className={styles.hero}>
      <HeroPhoto launch={launch} locale={locale} />
      <div className={styles.body}>
        <span className={styles.eyebrow}>{eyebrow}</span> <StatusTag launch={launch} locale={locale} />
        <h1>{launch.name}</h1>
        <p className={styles.sub}>
          {launch.rocket.fullName} · {launch.provider.name}
        </p>

        {liftedOff ? <Outcome launch={launch} locale={locale} /> : showCountdown ? <Countdown targetIso={launch.net} locale={locale} /> : null}

        <p className={styles.when}>
          <strong>
            <LocalTime iso={launch.net} precision={launch.netPrecision} showZone locale={locale} />
          </strong>
          {launch.netPrecision === 'day' && (chinese ? '（时间待定）' : ' (time not set yet)')}
          <br />
          {launch.pad.name} · {launch.pad.locationName}
        </p>
        {launch.latestUpdate && (
          <p className={styles.update}>
            {chinese ? '最新动态：' : 'Update: '}
            <span lang="en">{launch.latestUpdate.comment}</span>
          </p>
        )}

        {(watchLink || showCalendar) && (
          <div className={styles.actions}>
            {watchLink && (
              <ButtonLink href={watchLink.url} primary>
                <span aria-hidden="true">▶ </span>
                {isFinished(launch.status)
                  ? (chinese ? '观看回放' : 'Watch replay')
                  : (chinese ? '观看直播' : 'Watch live')}
              </ButtonLink>
            )}
            {showCalendar && <AddToCalendarButton launch={launch} locale={locale} />}
          </div>
        )}
      </div>
    </section>
  );
}
