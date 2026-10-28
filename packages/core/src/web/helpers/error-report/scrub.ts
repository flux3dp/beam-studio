/**
 * Personal-data scrub for the automatic error report (docs/prd/error-report-upload §7.2).
 * Only the upload path uses this; the manual Help → Bug Report download stays complete.
 */
import type { StorageKey } from '@core/interfaces/IStorage';

/**
 * Storage keys dropped from the automatic report: the first three embed user file paths,
 * `flux-101` is keyed by FLUX ID email, `maintenance-records` carries the machine nickname and
 * the account that ticked each task.
 */
export const SCRUBBED_STORAGE_KEYS: StorageKey[] = [
  'recent_files',
  'auto-save-config',
  'ador-backup-path',
  'flux-101',
  'maintenance-records',
];

/**
 * Home-directory forms that can appear anywhere in the joined report text (storage dump,
 * websocket log with font paths, fluxghost --debug lines). Each match is replaced by `~`.
 * Windows first: a file URL like `file:///C:/Users/x/` also contains `/Users/x`, and the
 * drive-letter pattern must consume it before the POSIX one sees it.
 */
// A username may contain spaces ("Dean Sung") when a separator follows it; a bare home dir with
// nothing after it ("in /Users/alice now") is a single token so the rest of the line survives.
const USERNAME = String.raw`(?:[^\\/\s"']+(?: [^\\/\s"']+)*(?=[\\/])|[^\\/\s"']+)`;

const HOME_PATH_PATTERNS: RegExp[] = [
  // Windows: drive letter, `Users` in any case, then the username; separators may be `\`,
  // JSON-escaped `\\` (storage dump) or `/` (file URLs).
  new RegExp(String.raw`[A-Za-z]:(?:\\\\|\\|/)[Uu]sers(?:\\\\|\\|/)${USERNAME}`, 'g'),
  // macOS and Linux: case-sensitive on purpose so URL paths such as `/users/me` are left alone.
  new RegExp(String.raw`/(?:Users|home)/${USERNAME}`, 'g'),
];

/** Replaces every home-directory prefix in `text` with `~`. */
export const scrubReport = (text: string): string =>
  HOME_PATH_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, '~'), text);
