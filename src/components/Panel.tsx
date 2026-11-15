import type { ReactNode } from 'react';
import styles from './Panel.module.css';

/** A titled block with a rule on top, the building block of the detail layout. */
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.panel}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
