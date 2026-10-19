/**
 * Client-side upload limits for the automatic error report (docs/prd/error-report-upload §7.7):
 * a per-serial daily cap and a per-fingerprint cooldown that widens on every upload.
 * The manual Help → Bug Report download never goes through here.
 */
import storage from '@core/implementations/storage';

export const DAILY_LIMIT = 10;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** cooldown after the 1st, 2nd, 3rd, 4th+ upload of the same fingerprint */
export const COOLDOWN_WINDOWS_MS = [HOUR, DAY, 7 * DAY, 30 * DAY] as const;

/** entries whose window ended this long ago are pruned */
const PRUNE_AFTER_MS = 30 * DAY;

export interface CooldownEntry {
  /** index into COOLDOWN_WINDOWS_MS used for the current window */
  level: number;
  nextAllowed: number;
  /** occurrences suppressed since the last upload; sent as occurrences_since_last */
  skipped: number;
}

export type BlockReason = 'cooldown' | 'daily-limit';

/** Local-time calendar day, so the daily limit resets at the user's midnight. */
const todayKey = (now: number): string => {
  const d = new Date(now);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Stable key for "the same problem": one serial, one error code, one app and firmware version. */
export const makeFingerprint = (
  serial: string,
  errorCode: string,
  appVersion: string,
  firmwareVersion: string,
): string => [serial, errorCode, appVersion, firmwareVersion].join('|');

/** Today's per-serial counts; a counter from another day is discarded whole. */
const readCounter = (now: number): Record<string, number> => {
  const counter = storage.get('error-report-counter');

  return counter?.date === todayKey(now) ? (counter.counts ?? {}) : {};
};

const readCooldown = (now: number): Record<string, CooldownEntry> =>
  Object.fromEntries(
    Object.entries(storage.get('error-report-cooldown') ?? {}).filter(
      ([, entry]) => entry?.nextAllowed + PRUNE_AFTER_MS > now,
    ),
  );

/** Why an upload must not happen right now, or null when it may. */
export const getBlockReason = (serial: string, fingerprint: string, now = Date.now()): BlockReason | null => {
  const entry = readCooldown(now)[fingerprint];

  if (entry && now < entry.nextAllowed) return 'cooldown';

  return (readCounter(now)[serial] ?? 0) >= DAILY_LIMIT ? 'daily-limit' : null;
};

/** Suppressed occurrences accumulated for this fingerprint, to send with the next upload. */
export const getSkipped = (fingerprint: string, now = Date.now()): number =>
  readCooldown(now)[fingerprint]?.skipped ?? 0;

/** Call after a successful upload: counts it for today and widens the fingerprint's window. */
export const recordUpload = (serial: string, fingerprint: string, now = Date.now()): void => {
  const counts = readCounter(now);

  counts[serial] = (counts[serial] ?? 0) + 1;
  storage.set('error-report-counter', { counts, date: todayKey(now) });

  const cooldown = readCooldown(now);
  const level = Math.min((cooldown[fingerprint]?.level ?? -1) + 1, COOLDOWN_WINDOWS_MS.length - 1);

  cooldown[fingerprint] = { level, nextAllowed: now + COOLDOWN_WINDOWS_MS[level], skipped: 0 };
  storage.set('error-report-cooldown', cooldown);
};

/** Call when an occurrence was suppressed by the cooldown, so its count travels with the next upload. */
export const recordSkipped = (fingerprint: string, now = Date.now(), count = 1): void => {
  const cooldown = readCooldown(now);
  const entry = cooldown[fingerprint];

  if (!entry || !count) return;

  entry.skipped += count;
  storage.set('error-report-cooldown', cooldown);
};
