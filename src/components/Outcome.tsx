import type { Launch } from '@/lib/types';
import styles from './Outcome.module.css';

/** Takes the place of the countdown once the rocket has left the pad. */
export function Outcome({ launch }: { launch: Launch }) {
  const failed = launch.status === 'failure' || launch.status === 'partial_failure';
  const text = launch.status === 'in_flight' ? 'In flight' : launch.statusLabel;

  return (
    <div className={`${styles.outcome} ${failed ? styles.failed : ''}`}>
      <p className={styles.result}>{text}</p>
      {launch.failReason && <p className={styles.reason}>{launch.failReason}</p>}
    </div>
  );
}
