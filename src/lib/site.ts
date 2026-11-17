/** The site's name. Change it here and it changes everywhere. */
export const SITE_NAME = 'Liftoff';

export const SITE_DESCRIPTION = 'Upcoming and recent rocket launches worldwide, with live countdowns.';

/**
 * The folder the site is served from. On GitHub Pages a project lives at
 * username.github.io/<repo>/, so every address needs "/<repo>" in front.
 * The deploy workflow sets this; locally it is empty and the site sits at "/".
 * next/link adds it to page links automatically; hand-written paths (the
 * manifest and icons) must add it themselves.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * The site's full public address, base path included and no trailing slash.
 * Needed wherever a link leaves the site: link previews (Open Graph) and the
 * sitemap. The deploy workflow sets it from GitHub Pages; anywhere else it
 * falls back to the live site, so previews made from a local build still work.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://iknowitsimpossible.github.io/launch-tracker')
  .replace(/\/+$/, '');
