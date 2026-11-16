import type { ReactNode } from 'react';
import styles from './ButtonLink.module.css';

interface ButtonLinkProps {
  href: string;
  primary?: boolean;
  children: ReactNode;
}

/** A pill-shaped link to another website. Opens in a new tab. */
export function ButtonLink({ href, primary = false, children }: ButtonLinkProps) {
  return (
    <a
      className={`${styles.button} ${primary ? styles.primary : ''}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
