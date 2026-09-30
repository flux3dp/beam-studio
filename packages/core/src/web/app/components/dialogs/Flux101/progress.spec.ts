import { setStorage } from '@core/app/stores/storageStore';

import {
  completeLesson,
  continueLessonId,
  earnedBadges,
  getBucket,
  isCourseComplete,
  type LessonProgress,
  mergeBuckets,
  mergeLesson,
  recordPlayback,
  STORAGE_KEY,
} from './progress';

const watched = (playedSec = 100): LessonProgress => ({
  completedAt: '2026-01-01T00:00:00.000Z',
  completedVia: 'watched',
  playedSec,
  resumeSec: playedSec,
  status: 'completed',
});
const marked = (): LessonProgress => ({ ...watched(0), completedVia: 'marked_done' });
const partial = (playedSec: number): LessonProgress => ({ playedSec, resumeSec: playedSec, status: 'in_progress' });

describe('mergeLesson', () => {
  test('completed beats in_progress regardless of playedSec', () => {
    expect(mergeLesson(partial(500), marked())?.status).toBe('completed');
    expect(mergeLesson(marked(), partial(500))?.status).toBe('completed');
  });

  test('watched beats marked_done', () => {
    expect(mergeLesson(marked(), watched())?.completedVia).toBe('watched');
    expect(mergeLesson(watched(), marked())?.completedVia).toBe('watched');
  });

  test('higher playedSec wins among in_progress, higher resumeSec is carried', () => {
    const r = mergeLesson({ ...partial(10), resumeSec: 40 }, partial(30));

    expect(r?.playedSec).toBe(30);
    expect(r?.resumeSec).toBe(40);
  });

  test('creditGranted is OR-ed and undefined inputs pass through', () => {
    expect(mergeLesson({ ...watched(), creditGranted: true }, watched())?.creditGranted).toBe(true);
    expect(mergeLesson(undefined, partial(3))).toEqual(partial(3));
    expect(mergeLesson(undefined, undefined)).toBeUndefined();
  });
});

describe('mergeBuckets', () => {
  test('unions lessons, keeps newest lastLessonId, ORs nudgeDismissed', () => {
    const a = {
      catalogVersion: 1,
      lastLessonId: '1-2',
      lessons: { '1-1': watched() },
      nudgeDismissed: true as const,
      updatedAt: '2026-02-01T00:00:00.000Z',
    };
    const b = {
      catalogVersion: 1,
      lastLessonId: '2-1',
      lessons: { '1-2': partial(5), 'x-9': partial(1) },
      updatedAt: '2026-03-01T00:00:00.000Z',
    };
    const m = mergeBuckets(a, b);

    expect(Object.keys(m.lessons).sort()).toEqual(['1-1', '1-2', 'x-9']); // unknown ids kept, not deleted
    expect(m.lastLessonId).toBe('2-1');
    expect(m.nudgeDismissed).toBe(true);
    expect(m.updatedAt).toBe('2026-03-01T00:00:00.000Z');
  });
});

describe('actions on the anonymous bucket', () => {
  beforeEach(() => setStorage(STORAGE_KEY, {} as any));

  test('recordPlayback accumulates and completes at 90% of duration (1-1 is 79 s)', () => {
    recordPlayback('1-1', 60, 60);
    expect(getBucket().lessons['1-1']).toMatchObject({ playedSec: 60, resumeSec: 60, status: 'in_progress' });
    recordPlayback('1-1', 12, 72);
    expect(getBucket().lessons['1-1']).toMatchObject({ completedVia: 'watched', playedSec: 72, status: 'completed' });
    expect(getBucket().lastLessonId).toBe('1-1');
  });

  test('completeLesson is monotonic: marked_done upgrades to watched, never the reverse', () => {
    completeLesson('2-1', 'marked_done');
    expect(getBucket().lessons['2-1'].completedVia).toBe('marked_done');
    completeLesson('2-1', 'watched');
    expect(getBucket().lessons['2-1'].completedVia).toBe('watched');
    completeLesson('2-1', 'marked_done');
    expect(getBucket().lessons['2-1'].completedVia).toBe('watched');
  });

  test('derived: badges, continue target, course completion', () => {
    ['1-1', '1-2', '1-3'].forEach((id) => completeLesson(id, 'watched'));
    expect(earnedBadges(getBucket()).map((c) => c.id)).toEqual(['ch1']);
    expect(continueLessonId(getBucket())).toBe('2-1');
    recordPlayback('3-3', 5, 5);
    expect(continueLessonId(getBucket())).toBe('3-3'); // last opened, unfinished
    expect(isCourseComplete(getBucket())).toBe(false);
  });
});
