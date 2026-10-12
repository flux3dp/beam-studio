/**
 * Personal-data scrub for the automatic error report (docs/prd/error-report-upload §7.2).
 * Only the upload path uses this; the manual Help → Bug Report download stays complete.
 */
import type { StorageKey } from '@core/interfaces/IStorage';

/** storage keys that embed user file paths; dropped from the automatic report */
export const SCRUBBED_STORAGE_KEYS: StorageKey[] = ['recent_files', 'auto-save-config', 'ador-backup-path'];

/**
 * Home-directory forms that can appear anywhere in the joined report text (storage dump,
 * websocket log with font paths, fluxghost --debug lines). Each match is replaced by `~`.
 * Windows first: a file URL like `file:///C:/Users/x/` also contains `/Users/x`, and the
 * drive-letter pattern must consume it before the POSIX one sees it.
 */
const HOME_PATH_PATTERNS: RegExp[] = [
  // Windows: drive letter, `Users` in any case, then the username; separators may be `\`,
  // JSON-escaped `\\` (storage dump) or `/` (file URLs). Username stops at the next separator.
  /[A-Za-z]:(?:\\\\|\\|\/)[Uu]sers(?:\\\\|\\|\/)[^\\/\s"']+/g,
  // macOS and Linux: case-sensitive on purpose so URL paths such as `/users/me` are left alone.
  /\/(?:Users|home)\/[^\\/\s"']+/g,
];

/** Replaces every home-directory prefix in `text` with `~`. */
export const scrubReport = (text: string): string =>
  HOME_PATH_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, '~'), text);
