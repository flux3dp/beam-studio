// One YouTube IFrame Player at a time (PRD §7). Loads the API once, cues the current lesson at its
// resume point, ticks playedSec while PLAYING, completes on ENDED, and pauses when the tab loses
// focus. Never autoplays on open; only resumes across the dialog ⇄ PiP remount (D24).
import { type RefObject, useEffect, useRef } from 'react';

import { TabEvents } from '@core/app/constants/ipcEvents';
import communicator from '@core/implementations/communicator';

import { LESSONS } from './catalog';
import { useFlux101Store } from './flux101Store';
import { completeLesson, getBucket, recordPlayback } from './progress';

interface YTPlayer {
  cueVideoById: (opts: { startSeconds?: number; videoId: string }) => void;
  destroy: () => void;
  getCurrentTime: () => number;
  pauseVideo: () => void;
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
  PlayerState: { BUFFERING: number; ENDED: number; PLAYING: number };
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

// Carried across the dialog ⇄ PiP remount (D24): whether the video was playing, and its exact
// position including rewinds. The persisted `resumeSec` is the furthest point instead (what a
// reopen and the FLUX ID sync use), so both are dropped when the course is closed.
let wasPlaying = false;
let carried: null | { lessonId: string; sec: number } = null;

const videoIdOf = (lessonId: string): string => LESSONS.find((l) => l.id === lessonId)!.youtubeId;
const resumeOf = (lessonId: string): number => getBucket().lessons[lessonId]?.resumeSec ?? 0;

/** `host` must be a div the player can replace with its iframe. */
export const useYouTubePlayer = (host: RefObject<HTMLDivElement | null>, lessonId: string): void => {
  const player = useRef<null | YTPlayer>(null);
  const lesson = useRef(lessonId);

  lesson.current = lessonId;

  useEffect(() => {
    let tick: ReturnType<typeof setInterval> | undefined;
    let disposed = false;

    loadApi().then((YT) => {
      if (disposed || !host.current) return;

      const start = carried?.lessonId === lessonId ? carried.sec : resumeOf(lessonId);

      player.current = new YT.Player(host.current, {
        events: {
          onStateChange: ({ data }: { data: number }) => {
            clearInterval(tick);
            wasPlaying = data === YT.PlayerState.PLAYING || data === YT.PlayerState.BUFFERING;

            if (data === YT.PlayerState.PLAYING) {
              tick = setInterval(() => recordPlayback(lesson.current, 1, player.current!.getCurrentTime()), 1000);
            } else if (data === YT.PlayerState.ENDED) {
              completeLesson(lesson.current, 'watched');
            }
          },
        },
        height: '100%',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: wasPlaying ? 1 : 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          start: Math.floor(start),
        },
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

      // Methods exist only once the iframe is up. Persist the position (furthest-point rule) and
      // carry the exact one for a remount; a close drops the carried state so reopening starts
      // paused at the furthest point.
      const sec = player.current?.getCurrentTime?.();
      const closing = useFlux101Store.getState().view === 'closed';

      if (sec) recordPlayback(lesson.current, 0, sec);

      carried = closing || !sec ? null : { lessonId: lesson.current, sec };
      wasPlaying &&= !closing;

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
