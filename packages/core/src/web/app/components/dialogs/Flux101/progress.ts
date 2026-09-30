// FLUX 101 progress: per-owner buckets in storage['beam-studio-101'] (PRD §6.2, §9).
// Store source data only; badges / certificate / credits are derived from `lessons`.

import { useEffect, useState } from 'react';

import { useStorageStore } from '@core/app/stores/storageStore';
import { fluxIDEvents, getCurrentUser } from '@core/helpers/api/flux-id';

import { CATALOG_VERSION, type Chapter, CHAPTERS, LESSON_IDS, LESSONS } from './catalog';

export const STORAGE_KEY = 'beam-studio-101';
export const ANONYMOUS = 'anonymous';
export const WATCHED_RATIO = 0.9;

export type CompletedVia = 'marked_done' | 'watched';

export interface LessonProgress {
  completedAt?: string;
  completedVia?: CompletedVia;
  /** Server-confirmed credit grant; idempotency guard. */
  creditGranted?: boolean;
  /** Seconds spent in PLAYING state. Scrubbing does not count. */
  playedSec: number;
  /** Last playback position, for resume. */
  resumeSec: number;
  status: 'completed' | 'in_progress';
}

export interface Flux101Bucket {
  catalogVersion: number;
  lastLessonId?: string;
  lessons: Record<string, LessonProgress>;
  /** R2a post-tutorial prompt has been answered; never shown again. */
  nudgeDismissed?: true;
  updatedAt: string;
}

export type Flux101Storage = Record<string, Flux101Bucket> & {
  anonymous?: Flux101Bucket & { claimedBy?: string };
};

const now = (): string => new Date().toISOString();

export const emptyBucket = (): Flux101Bucket => ({
  catalogVersion: CATALOG_VERSION,
  lessons: {},
  updatedAt: new Date(0).toISOString(),
});

/** Bucket owner: the logged-in FLUX ID email, else 'anonymous'. */
export const ownerKey = (): string => getCurrentUser()?.email?.toLowerCase() ?? ANONYMOUS;

export const readStorage = (): Flux101Storage => useStorageStore.getState()[STORAGE_KEY] ?? {};
export const getBucket = (owner = ownerKey()): Flux101Bucket => readStorage()[owner] ?? emptyBucket();
export const writeBucket = (owner: string, bucket: Flux101Bucket): void =>
  useStorageStore.getState().set(STORAGE_KEY, { ...readStorage(), [owner]: bucket });
export const updateBucket = (fn: (bucket: Flux101Bucket) => Flux101Bucket, owner = ownerKey()): void =>
  writeBucket(owner, { ...fn(getBucket(owner)), updatedAt: now() });

/* ───────────── merge ───────────── */

/**
 * Rules (PRD §9): completed beats in_progress; among equal status, watched beats marked_done,
 * then higher playedSec; carry the higher resumeSec and OR the creditGranted flag so a
 * confirmed grant is never lost.
 */
export const mergeLesson = (a?: LessonProgress, b?: LessonProgress): LessonProgress | undefined => {
  if (!a || !b) return a ?? b;

  // completed+watched > completed+marked_done > in_progress, then higher playedSec
  const rank = (p: LessonProgress): number => (p.status !== 'completed' ? 0 : p.completedVia === 'watched' ? 2 : 1);
  const winner = (rank(a) - rank(b) || a.playedSec - b.playedSec) >= 0 ? a : b;

  return {
    ...winner,
    creditGranted: a.creditGranted || b.creditGranted || undefined,
    resumeSec: Math.max(a.resumeSec, b.resumeSec),
  };
};

export const mergeBuckets = (...buckets: Flux101Bucket[]): Flux101Bucket => {
  const lessons: Record<string, LessonProgress> = {};

  // Merge all lessons in all buckets
  for (const lessonId of new Set(buckets.flatMap((b) => Object.keys(b.lessons)))) {
    const merged = buckets.map((b) => b.lessons[lessonId]).reduce<LessonProgress | undefined>(mergeLesson, undefined);

    if (merged) lessons[lessonId] = merged;
  }

  const newest = buckets.reduce((x, y) => (y.updatedAt > x.updatedAt ? y : x), emptyBucket());

  return {
    catalogVersion: Math.max(...buckets.map((b) => b.catalogVersion)),
    lastLessonId: newest.lastLessonId,
    lessons,
    nudgeDismissed: buckets.some((b) => b.nudgeDismissed) || undefined,
    updatedAt: newest.updatedAt,
  };
};

/* ───────────── actions ───────────── */

const complete = (cur: LessonProgress, via: CompletedVia): LessonProgress =>
  cur.status === 'completed' && (cur.completedVia === 'watched' || via === 'marked_done')
    ? cur // monotonic: never downgrade watched → marked_done, never re-complete
    : { ...cur, completedAt: now(), completedVia: via, status: 'completed' };

/** Called from player tick while PLAYING. */
export const recordPlayback = (lessonId: string, playedDelta: number, resumeSec: number): void =>
  updateBucket((b) => {
    const cur = b.lessons[lessonId] ?? { playedSec: 0, resumeSec: 0, status: 'in_progress' };
    const duration = LESSONS.find((l) => l.id === lessonId)?.durationSec ?? Infinity;
    const next = { ...cur, playedSec: cur.playedSec + playedDelta, resumeSec: Math.max(cur.resumeSec, resumeSec) };

    return {
      ...b,
      lastLessonId: lessonId,
      lessons: {
        ...b.lessons,
        [lessonId]: next.playedSec >= WATCHED_RATIO * duration ? complete(next, 'watched') : next,
      },
    };
  });

/** ENDED event → 'watched'; the Mark done button → 'marked_done'. */
export const completeLesson = (lessonId: string, via: CompletedVia): void =>
  updateBucket((b) => {
    const cur = b.lessons[lessonId] ?? { playedSec: 0, resumeSec: 0, status: 'in_progress' };

    return { ...b, lastLessonId: lessonId, lessons: { ...b.lessons, [lessonId]: complete(cur, via) } };
  });

export const setLastLesson = (lessonId: string): void => updateBucket((b) => ({ ...b, lastLessonId: lessonId }));
export const dismissNudge = (): void => updateBucket((b) => ({ ...b, nudgeDismissed: true }));

/* ───────────── derived ───────────── */

export const isLessonComplete = (b: Flux101Bucket, id: string): boolean => b.lessons[id]?.status === 'completed';
export const completedCount = (b: Flux101Bucket): number =>
  Object.keys(b.lessons).filter((id) => LESSON_IDS.has(id) && isLessonComplete(b, id)).length;
export const isChapterComplete = (b: Flux101Bucket, ch: Chapter): boolean =>
  ch.lessons.every((l) => isLessonComplete(b, l.id));
export const isCourseComplete = (b: Flux101Bucket): boolean => CHAPTERS.every((ch) => isChapterComplete(b, ch));
export const earnedBadges = (b: Flux101Bucket): Chapter[] => CHAPTERS.filter((ch) => isChapterComplete(b, ch));
/** "Continue" target: the last opened lesson if unfinished, else the first unfinished lesson. */
export const continueLessonId = (b: Flux101Bucket): string =>
  b.lastLessonId && !isLessonComplete(b, b.lastLessonId)
    ? b.lastLessonId
    : (LESSONS.find((l) => !isLessonComplete(b, l.id)) ?? LESSONS[0]).id;

/* ───────────── react ───────────── */

/** Active owner's bucket; re-renders on storage writes and on FLUX ID login / logout. */
export const useFlux101Bucket = (): Flux101Bucket => {
  const all = useStorageStore((s) => s[STORAGE_KEY]);
  const [owner, setOwner] = useState(ownerKey);

  useEffect(() => {
    const onUser = () => setOwner(ownerKey());

    fluxIDEvents.on('update-user', onUser);

    return () => {
      fluxIDEvents.off('update-user', onUser);
    };
  }, []);

  return all?.[owner] ?? emptyBucket();
};
