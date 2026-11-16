import type { ReactNode } from 'react';
import pen from './pen.module.css';

/**
 * The frame every mission plate drawing sits in: an 80 x 64 drawing area,
 * the shared pen style, and an accessible description for screen readers.
 * Each drawing only has to supply its shapes.
 */
export function PlateSvg({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg className={pen.plate} viewBox="0 0 80 64" role="img" aria-label={label}>
      {children}
    </svg>
  );
}
