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
  /** Small label above the title, e.g. "Next launch". */
  eyebrow: string;
}

export function Hero({ launch, eyebrow }: HeroProps) {
  const liftedOff = hasLiftedOff(launch.status);
  const watchLink = launch.webcasts.find((link) => isHttpUrl(link.url));
  const showCountdown = !liftedOff && launch.netPrecision === 'exact';
  // An all-day event is fine for a known date; a bare month cannot go in a calendar.
  const showCalendar = !liftedOff && launch.netPrecision !== 'approximate';

  return (
    <section className={styles.hero}>
      <HeroPhoto launch={launch} />
      <div className={styles.body}>
        <span className={styles.eyebrow}>{eyebrow}</span> <StatusTag launch={launch} />
        <h1>{launch.name}</h1>
        <p className={styles.sub}>
          {launch.rocket.fullName} · {launch.provider.name}
        </p>

        {liftedOff ? <Outcome launch={launch} /> : showCountdown ? <Countdown targetIso={launch.net} /> : null}

        <p className={styles.when}>
          <strong>
            <LocalTime iso={launch.net} precision={launch.netPrecision} showZone />
          </strong>
          {launch.netPrecision === 'day' && ' (time not set yet)'}
          <br />
          {launch.pad.name} · {launch.pad.locationName}
        </p>
        {launch.latestUpdate && <p className={styles.update}>Update: {launch.latestUpdate.comment}</p>}

        {(watchLink || showCalendar) && (
          <div className={styles.actions}>
            {watchLink && (
              <ButtonLink href={watchLink.url} primary>
                <span aria-hidden="true">▶ </span>
                {isFinished(launch.status) ? 'Watch replay' : 'Watch live'}
              </ButtonLink>
            )}
            {showCalendar && <AddToCalendarButton launch={launch} />}
          </div>
        )}
      </div>
    </section>
  );
}
