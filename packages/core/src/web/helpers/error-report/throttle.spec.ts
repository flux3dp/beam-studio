import storage from '@core/implementations/storage';

import {
  COOLDOWN_WINDOWS_MS,
  DAILY_LIMIT,
  getBlockReason,
  getSkipped,
  makeFingerprint,
  recordSkipped,
  recordUpload,
} from './throttle';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
// 2026-10-12 10:00 local (Asia/Taipei in tests)
const T0 = new Date(2026, 9, 12, 10, 0, 0).getTime();
const FP = makeFingerprint('SN12345678', 'HARDWARE_ERROR_OVERHEAT', '2.6.0', '6.5.3');

describe('throttle', () => {
  beforeEach(() => {
    storage.clearAll();
  });

  test('makeFingerprint changes with any of its four inputs', () => {
    expect(makeFingerprint('a', 'b', 'c', 'd')).toBe('a|b|c|d');
    expect(makeFingerprint('a', 'b', 'c', 'e')).not.toBe(FP);
  });

  test('first occurrence is allowed', () => {
    expect(getBlockReason('SN12345678', FP, T0)).toBeNull();
    expect(getSkipped(FP, T0)).toBe(0);
  });

  test('cooldown widens 1 h → 24 h → 7 d → 30 d and then stays at 30 d', () => {
    let now = T0;

    COOLDOWN_WINDOWS_MS.forEach((window) => {
      recordUpload('SN12345678', FP, now);
      expect(getBlockReason('SN12345678', FP, now + window - 1)).toBe('cooldown');
      expect(getBlockReason('SN12345678', FP, now + window)).toBeNull();
      now += window;
    });

    recordUpload('SN12345678', FP, now);
    expect(getBlockReason('SN12345678', FP, now + 30 * DAY - 1)).toBe('cooldown');
    expect(getBlockReason('SN12345678', FP, now + 30 * DAY)).toBeNull();
  });

  test('skipped occurrences accumulate and reset on the next upload', () => {
    recordUpload('SN12345678', FP, T0);
    recordSkipped(FP, T0 + 1);
    recordSkipped(FP, T0 + 2);
    expect(getSkipped(FP, T0 + 3)).toBe(2);

    recordUpload('SN12345678', FP, T0 + HOUR);
    expect(getSkipped(FP, T0 + HOUR)).toBe(0);
  });

  test('recordSkipped without a prior upload is a no-op', () => {
    recordSkipped(FP, T0);
    expect(getSkipped(FP, T0)).toBe(0);
    expect(storage.get('error-report-cooldown')).toBeUndefined();
  });

  test('a different fingerprint has its own window', () => {
    recordUpload('SN12345678', FP, T0);

    const other = makeFingerprint('SN12345678', 'HARDWARE_ERROR_OVERHEAT', '2.6.1', '6.5.3');

    expect(getBlockReason('SN12345678', other, T0 + 1)).toBeNull();
  });

  test('daily limit blocks the 11th upload for the same serial and resets after local midnight', () => {
    for (let i = 0; i < DAILY_LIMIT; i += 1) {
      recordUpload('SN12345678', `fp-${i}`, T0 + i);
    }

    expect(getBlockReason('SN12345678', 'fp-new', T0 + DAILY_LIMIT)).toBe('daily-limit');
    expect(getBlockReason('OTHER-SERIAL', 'fp-new', T0 + DAILY_LIMIT)).toBeNull();

    const nextDay = new Date(2026, 9, 13, 0, 0, 1).getTime();

    expect(getBlockReason('SN12345678', 'fp-new', nextDay)).toBeNull();
  });

  test('cooldown is checked before the daily limit', () => {
    for (let i = 0; i < DAILY_LIMIT; i += 1) {
      recordUpload('SN12345678', `fp-${i}`, T0 + i);
    }

    expect(getBlockReason('SN12345678', 'fp-0', T0 + DAILY_LIMIT)).toBe('cooldown');
  });

  test('entries are pruned 30 days after their window ends', () => {
    recordUpload('SN12345678', FP, T0);
    recordUpload('OTHER', 'keep', T0 + 29 * DAY);
    recordUpload('OTHER', 'other', T0 + 31 * DAY + HOUR);

    const cooldown = storage.get('error-report-cooldown');

    expect(cooldown[FP]).toBeUndefined();
    expect(cooldown.keep).toBeDefined();
    expect(cooldown.other).toBeDefined();
  });
});

describe('error-report-counter shape', () => {
  beforeEach(() => storage.clearAll());

  test('one object per day with one count per serial; a new day replaces it whole', () => {
    recordUpload('A', 'fp-1', T0);
    recordUpload('A', 'fp-2', T0 + 1);
    recordUpload('B', 'fp-3', T0 + 2);
    expect(storage.get('error-report-counter')).toEqual({ counts: { A: 2, B: 1 }, date: '2026-10-12' });

    recordUpload('A', 'fp-4', new Date(2026, 9, 13, 0, 0, 1).getTime());
    expect(storage.get('error-report-counter')).toEqual({ counts: { A: 1 }, date: '2026-10-13' });
  });
});
