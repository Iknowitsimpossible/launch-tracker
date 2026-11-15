/**
 * Links come from a data file we do not control. Only http(s) addresses are
 * allowed, so a "javascript:" address can never end up in an href.
 */
export function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}
