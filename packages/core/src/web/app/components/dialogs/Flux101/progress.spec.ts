import { setStorage } from '@core/app/stores/storageStore';

import { LESSONS } from './catalog';
import {
  adoptOnLogin,
  claimedByOther,
  completeLesson,
  continueLessonId,
  earnedBadges,
  getBucket,
  isCourseComplete,
  type LessonProgress,
  markCreditsGranted,
  maskEmail,
  mergeBuckets,
  mergeLesson,
  onBucketWrite,
  readStorage,
  recordPlayback,
  setLastLesson,
  STORAGE_KEY,
  ungrantedLessonIds,
  updateBucket,
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

  test('recordPlayback keeps the furthest position as the resume point (rewinds stay in-session)', () => {
    recordPlayback('1-2', 30, 30);
    recordPlayback('1-2', 1, 10); // user scrubbed back to 0:10
    expect(getBucket().lessons['1-2']).toMatchObject({ playedSec: 31, resumeSec: 30 });
  });

  test('completeLesson is monotonic: marked_done upgrades to watched, never the reverse', () => {
    expect(completeLesson('2-1', 'marked_done')).toEqual({ lessonId: '2-1', newlyCompleted: true });
    expect(getBucket().lessons['2-1'].completedVia).toBe('marked_done');
    expect(completeLesson('2-1', 'watched')).toEqual({ lessonId: '2-1', newlyCompleted: false });
    expect(getBucket().lessons['2-1'].completedVia).toBe('watched');
    expect(completeLesson('2-1', 'marked_done')).toBeUndefined();
    expect(completeLesson('2-1', 'watched')).toBeUndefined(); // nothing to celebrate twice
    expect(getBucket().lessons['2-1'].completedVia).toBe('watched');
  });

  test('recordPlayback reports the completion only on the tick that crosses the threshold', () => {
    const duration = LESSONS.find((l) => l.id === '1-1')!.durationSec;

    expect(recordPlayback('1-1', Math.ceil(duration * 0.9) - 1, 0)).toBeUndefined();
    expect(recordPlayback('1-1', 1, 0)).toEqual({ lessonId: '1-1', newlyCompleted: true });
    expect(recordPlayback('1-1', 1, 0)).toBeUndefined();
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

describe('login / claim', () => {
  beforeEach(() => setStorage(STORAGE_KEY, {} as any));

  test('maskEmail keeps first and last char of the local part and the whole domain', () => {
    expect(maskEmail('software@flux3dp.com')).toBe('s******e@flux3dp.com');
    expect(maskEmail('ab@x.io')).toBe('ab@x.io');
  });

  test('adoptOnLogin merges an unclaimed anonymous bucket, claims and mirrors it', () => {
    recordPlayback('1-1', 60, 60); // anonymous progress

    const merged = adoptOnLogin('a@x.io', {
      ...getBucket(),
      lessons: { '1-2': { playedSec: 5, resumeSec: 5, status: 'in_progress' } },
    });

    expect(Object.keys(merged.lessons).sort()).toEqual(['1-1', '1-2']);
    expect(readStorage()['a@x.io']).toEqual(merged);
    expect(readStorage().anonymous).toEqual({ ...merged, claimedBy: 'a@x.io' });
  });

  test("a signed-in owner's writes keep the anonymous mirror current", () => {
    adoptOnLogin('a@x.io');
    updateBucket((b) => ({ ...b, lastLessonId: '2-1' }), 'a@x.io');
    expect(readStorage().anonymous).toEqual({ ...readStorage()['a@x.io'], claimedBy: 'a@x.io' });
  });

  test('adoptOnLogin does not merge a bucket claimed by another account, but re-mirrors', () => {
    recordPlayback('1-1', 60, 60);
    adoptOnLogin('a@x.io');

    const b = adoptOnLogin('b@x.io');

    expect(b.lessons['1-1']).toBeUndefined();
    expect(readStorage().anonymous?.claimedBy).toBe('b@x.io');
    expect(claimedByOther()).toBe('b@x.io');
  });
});

describe('credits', () => {
  beforeEach(() => setStorage(STORAGE_KEY, {}));

  test('only watched, unconfirmed lessons are pending; marked_done never earns', () => {
    updateBucket((b) => ({
      ...b,
      lessons: { '1-1': watched(), '1-2': marked(), '1-3': { ...watched(), creditGranted: true }, '2-1': partial(10) },
    }));
    expect(ungrantedLessonIds(getBucket())).toEqual(['1-1']);
  });

  test('markCreditsGranted flags the lessons the server confirmed and leaves the rest alone', () => {
    updateBucket((b) => ({ ...b, lessons: { '1-1': watched(), '1-2': watched() } }));
    markCreditsGranted(['1-1']);
    expect(getBucket().lessons['1-1'].creditGranted).toBe(true);
    expect(getBucket().lessons['1-2'].creditGranted).toBeUndefined();
    expect(ungrantedLessonIds(getBucket())).toEqual(['1-2']);
  });

  test('a grant the bucket never saw becomes a watched completion (server is the truth); unknown ids are dropped', () => {
    markCreditsGranted(['2-1', '9-9']);

    const lesson = getBucket().lessons['2-1'];

    expect(lesson).toMatchObject({ completedVia: 'watched', creditGranted: true, playedSec: 0, status: 'completed' });
    expect(getBucket().lessons['9-9']).toBeUndefined();
    expect(ungrantedLessonIds(getBucket())).toEqual([]);
  });
});

describe('onBucketWrite', () => {
  test('fires once per write made here, after the storage holds the new bucket', () => {
    const seen: string[] = [];

    onBucketWrite(() => seen.push(getBucket().lastLessonId!));
    completeLesson('1-1', 'watched');
    setLastLesson('1-2');
    expect(seen).toEqual(['1-1', '1-2']);
  });
});
