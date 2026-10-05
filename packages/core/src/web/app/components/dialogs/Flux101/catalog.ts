// FLUX 101 course catalog (docs/prd/flux-101/flux-101.md §6.1). Lesson ids are the curriculum's
// own numbering and are stable forever — progress is keyed by them. Titles live in lang.flux_101.

export const COURSE_ID = 'beam-studio-101';
export const CATALOG_VERSION = 1;
/** FLUX+ one-time credits per `watched` lesson (D5); the server holds the authoritative amount. */
export const CREDITS_PER_LESSON = 0.5;

export type ChapterId = 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5';

export interface Lesson {
  durationSec: number;
  helpArticleUrl?: string;
  id: string;
  youtubeId: string;
}

export interface Chapter {
  badgeEmoji: string;
  id: ChapterId;
  lessons: Lesson[];
}

export const CHAPTERS: Chapter[] = [
  {
    badgeEmoji: '🦺',
    id: 'ch1',
    lessons: [
      { durationSec: 79, id: '1-1', youtubeId: '3hvYRIgaNaI' },
      { durationSec: 113, id: '1-2', youtubeId: 'MtJ0hqvXkRc' },
      { durationSec: 83, id: '1-3', youtubeId: 'EDjQ3bqCX-k' },
    ],
  },
  {
    badgeEmoji: '🎯',
    id: 'ch2',
    lessons: [
      { durationSec: 220, id: '2-1', youtubeId: 'c64vKb833ZY' },
      { durationSec: 121, id: '2-2', youtubeId: '6NqdVgtOG94' },
      { durationSec: 60, id: '2-3', youtubeId: 'a3UNqM7JTO4' },
      { durationSec: 98, id: '2-4', youtubeId: 'wYxXhfNwBmg' },
    ],
  },
  {
    badgeEmoji: '🖼️',
    id: 'ch3',
    lessons: [
      { durationSec: 92, id: '3-1', youtubeId: '5qpUEVveO6c' },
      { durationSec: 71, id: '3-2', youtubeId: 'YXj-6iE6QV8' },
      { durationSec: 54, id: '3-3', youtubeId: 'v0Qw08OrRvg' },
      { durationSec: 67, id: '3-4', youtubeId: '0WzA-yJuoDo' },
      { durationSec: 51, id: '3-5', youtubeId: 'Y_SQBcIiqSg' },
      { durationSec: 49, id: '3-6', youtubeId: 'bx6thjbQZb4' },
    ],
  },
  {
    badgeEmoji: '🎨',
    id: 'ch4',
    lessons: [
      { durationSec: 95, id: '4-1', youtubeId: '6GRp28sEHlA' },
      { durationSec: 98, id: '4-2', youtubeId: 'ntsRHEm62io' },
      { durationSec: 56, id: '4-3', youtubeId: 'HNn292DVlM0' },
      { durationSec: 53, id: '4-4', youtubeId: '11Birvpo7mU' },
      { durationSec: 78, id: '4-5', youtubeId: 'HD5pAL3ILUA' },
      { durationSec: 52, id: '4-6', youtubeId: 'El9b93AE-mM' },
      { durationSec: 91, id: '4-7', youtubeId: 'kFMPJdaDzpo' },
    ],
  },
  {
    badgeEmoji: '🎓',
    id: 'ch5',
    lessons: [
      { durationSec: 91, id: '5-1', youtubeId: 'Rg5wjtBDIcw' },
      { durationSec: 72, id: '5-2', youtubeId: 'zkuiSxIHtD8' },
      { durationSec: 106, id: '5-3', youtubeId: 'kK4pgCDC9mw' },
    ],
  },
];

export const LESSONS: Lesson[] = CHAPTERS.flatMap((c) => c.lessons);
export const LESSON_IDS = new Set(LESSONS.map((l) => l.id));
export const chapterOf = (lessonId: string): Chapter | undefined =>
  CHAPTERS.find((c) => c.lessons.some((l) => l.id === lessonId));
