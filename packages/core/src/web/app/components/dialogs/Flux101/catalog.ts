// FLUX 101 course catalog (docs/prd/flux-101/flux-101.md §6.1). Lesson ids are the curriculum's
// own numbering and are stable forever — progress is keyed by them. Titles live in lang.flux_101.

import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getActiveLang } from '@core/helpers/i18n';

/** FLUX+ one-time credits per `watched` lesson (D5); the server holds the authoritative amount. */
export const CREDITS_PER_LESSON = 0.5;

export type ChapterId = 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5';

export interface Lesson {
  durationSec: number;
  /**
   * Help Center article id (same across locales); see `helpArticleUrl`. Machine-operation lessons
   * carry one id per model (each machine guide has its own article); models not listed get no link.
   */
  helpArticleId?: Partial<Record<WorkAreaModel, string>> | string;
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
      {
        durationSec: 113,
        helpArticleId: {
          ado1: '7670223065871',
          fbb1b: '360001364136',
          fbb1p: '360001364136',
          fbb2: '11289780652303',
          fbm1: '4405127182479',
          fbm2: '13258320038415',
          fhexa1: '4407291479311',
          fhx2rf: '14809891584271',
          fpm1: '10777655491599',
        },
        id: '1-2',
        youtubeId: 'MtJ0hqvXkRc',
      },
      { durationSec: 83, helpArticleId: '4546842125455', id: '1-3', youtubeId: 'EDjQ3bqCX-k' },
    ],
  },
  {
    badgeEmoji: '🎯',
    id: 'ch2',
    lessons: [
      {
        durationSec: 220,
        helpArticleId: {
          fbb1b: '360001364796',
          fbb1p: '360001364796',
          fbb2: '11217964150671',
          fbm1: '4405448396175',
          fbm2: '14128368849935',
          fhexa1: '4410608969359',
        },
        id: '2-1',
        youtubeId: 'c64vKb833ZY',
      },
      {
        durationSec: 121,
        helpArticleId: {
          ado1: '8050503493647',
          fbb1b: '360004493976',
          fbb1p: '360004493976',
          fbb2: '11900383917199',
          fbm1: '360001684196',
          fbm2: '13276952000783',
          fhexa1: '6755065427983',
          fhx2rf: '14808990935311',
        },
        id: '2-2',
        youtubeId: '6NqdVgtOG94',
      },
      {
        durationSec: 60,
        helpArticleId: {
          ado1: '8030675691791',
          fbb1b: '13276051628687',
          fbb1p: '13276051628687',
          fbb2: '11216585533711',
          fbm1: '4405128797711',
          fbm2: '13258379407119',
          fhexa1: '4407402209295',
          fhx2rf: '14811334184975',
          fpm1: '11173605809295',
        },
        id: '2-3',
        youtubeId: 'a3UNqM7JTO4',
      },
      { durationSec: 98, id: '2-4', youtubeId: 'wYxXhfNwBmg' },
    ],
  },
  {
    badgeEmoji: '🖼️',
    id: 'ch3',
    lessons: [
      { durationSec: 92, helpArticleId: '9909611043215', id: '3-1', youtubeId: '5qpUEVveO6c' },
      { durationSec: 71, helpArticleId: '9909694991503', id: '3-2', youtubeId: 'YXj-6iE6QV8' },
      { durationSec: 54, helpArticleId: '9909701316111', id: '3-3', youtubeId: 'v0Qw08OrRvg' },
      { durationSec: 67, id: '3-4', youtubeId: '0WzA-yJuoDo' },
      { durationSec: 51, id: '3-5', youtubeId: 'Y_SQBcIiqSg' },
      {
        durationSec: 49,
        helpArticleId: {
          ado1: '10767944834191',
          fbb1b: '360000524055',
          fbb1p: '360000524055',
          fbb2: '11235052707215',
          fbm1: '10767975242767',
          fbm2: '14125713774991',
          fhexa1: '10767918414479',
          fhx2rf: '14811391033359',
          fpm1: '12883164952335',
        },
        id: '3-6',
        youtubeId: 'bx6thjbQZb4',
      },
    ],
  },
  {
    badgeEmoji: '🎨',
    id: 'ch4',
    lessons: [
      { durationSec: 95, helpArticleId: '9909522977039', id: '4-1', youtubeId: '6GRp28sEHlA' },
      { durationSec: 98, helpArticleId: '9969655538959', id: '4-2', youtubeId: 'ntsRHEm62io' },
      { durationSec: 56, helpArticleId: '9970594868367', id: '4-3', youtubeId: 'HNn292DVlM0' },
      { durationSec: 53, helpArticleId: '9909706433039', id: '4-4', youtubeId: '11Birvpo7mU' },
      { durationSec: 78, helpArticleId: '9969433181839', id: '4-5', youtubeId: 'HD5pAL3ILUA' },
      { durationSec: 52, id: '4-6', youtubeId: 'El9b93AE-mM' },
      { durationSec: 91, id: '4-7', youtubeId: 'kFMPJdaDzpo' },
    ],
  },
  {
    badgeEmoji: '🎓',
    id: 'ch5',
    lessons: [
      { durationSec: 91, id: '5-1', youtubeId: 'Rg5wjtBDIcw' },
      {
        durationSec: 72,
        helpArticleId: {
          fbb1b: '360001360555',
          fbb1p: '360001360555',
          fbb2: '11226562461455',
          fbm1: '4405454673679',
          fbm2: '13277033366415',
          fhexa1: '4410631328911',
          fhx2rf: '14811467378191',
        },
        id: '5-2',
        youtubeId: 'zkuiSxIHtD8',
      },
      { durationSec: 106, helpArticleId: '4405185865743', id: '5-3', youtubeId: 'kK4pgCDC9mw' },
    ],
  },
];

export const LESSONS: Lesson[] = CHAPTERS.flatMap((c) => c.lessons);
export const LESSON_IDS = new Set(LESSONS.map((l) => l.id));
/**
 * Help Center URL for a lesson's article. Only zh-tw (the source locale, always complete) and
 * en-us are used; other locales are not guaranteed to have every translation and would 404.
 */
export const helpArticleIdFor = (lesson: Lesson, model: string): string | undefined =>
  typeof lesson.helpArticleId === 'string' ? lesson.helpArticleId : lesson.helpArticleId?.[model as WorkAreaModel];

export const helpArticleUrl = (articleId: string): string => {
  const locale = getActiveLang() === 'zh-tw' ? 'zh-tw' : 'en-us';

  return `https://support.flux3dp.com/hc/${locale}/articles/${articleId}`;
};

export const chapterOf = (lessonId: string): Chapter | undefined =>
  CHAPTERS.find((c) => c.lessons.some((l) => l.id === lessonId));
