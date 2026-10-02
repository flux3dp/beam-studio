// One YouTube IFrame Player for the whole course (PRD §7). Loads the API once, cues (never
// autoplays) the current lesson at its resume point, ticks playedSec while PLAYING, completes on
// ENDED, and pauses when the tab loses focus.
import { type RefObject, useEffect, useRef } from 'react';

import { TabEvents } from '@core/app/constants/ipcEvents';
import communicator from '@core/implementations/communicator';

import { LESSONS } from './catalog';
import { completeLesson, getBucket, recordPlayback } from './progress';

interface YTPlayer {
  cueVideoById: (opts: { startSeconds?: number; videoId: string }) => void;
  destroy: () => void;
  getCurrentTime: () => number;
  pauseVideo: () => void;
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number };
}
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: YTNamespace;
  }
}

let apiPromise: null | Promise<YTNamespace> = null;
const loadApi = (): Promise<YTNamespace> => {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  apiPromise ??= new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT!);

    const script = document.createElement('script');

    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });

  return apiPromise;
};

const videoIdOf = (lessonId: string): string => LESSONS.find((l) => l.id === lessonId)!.youtubeId;
const resumeOf = (lessonId: string): number => getBucket().lessons[lessonId]?.resumeSec ?? 0;

/** `host` must be a div the player can replace with its iframe; mount it once, never remount. */
export const useYouTubePlayer = (host: RefObject<HTMLDivElement | null>, lessonId: string): void => {
  const player = useRef<null | YTPlayer>(null);
  const lesson = useRef(lessonId);

  lesson.current = lessonId;

  useEffect(() => {
    let tick: ReturnType<typeof setInterval> | undefined;
    let disposed = false;

    loadApi().then((YT) => {
      if (disposed || !host.current) return;

      player.current = new YT.Player(host.current, {
        events: {
          onStateChange: ({ data }: { data: number }) => {
            clearInterval(tick);

            if (data === YT.PlayerState.PLAYING) {
              tick = setInterval(() => recordPlayback(lesson.current, 1, player.current!.getCurrentTime()), 1000);
            } else if (data === YT.PlayerState.ENDED) {
              completeLesson(lesson.current, 'watched');
            }
          },
        },
        height: '100%',
        host: 'https://www.youtube-nocookie.com',
        playerVars: { modestbranding: 1, playsinline: 1, rel: 0, start: Math.floor(resumeOf(lessonId)) },
        videoId: videoIdOf(lessonId),
        width: '100%',
      });
    });

    const pause = () => player.current?.pauseVideo();
    const onVisibility = () => document.hidden && pause();

    document.addEventListener('visibilitychange', onVisibility);
    communicator.on(TabEvents.TabBlurred, pause);

    return () => {
      disposed = true;
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisibility);
      communicator.off(TabEvents.TabBlurred, pause);
      player.current?.destroy();
      player.current = null;
    };
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  // lesson switch: cue (no autoplay) at that lesson's resume point
  useEffect(() => {
    player.current?.cueVideoById({ startSeconds: Math.floor(resumeOf(lessonId)), videoId: videoIdOf(lessonId) });
  }, [lessonId]);
};
