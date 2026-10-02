// View state of the FLUX 101 course window (PRD §5.3): dialog ⇄ pip ⇄ closed.
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import { continueLessonId, getBucket, setLastLesson } from './progress';

export type Flux101View = 'closed' | 'dialog' | 'pip';

export const useFlux101Store = create(
  combine({ lessonId: continueLessonId(getBucket()), view: 'closed' as Flux101View }, (set) => ({
    close: () => set({ view: 'closed' }),
    expand: () => set({ view: 'dialog' }),
    minimize: () => set({ view: 'pip' }),
    open: (lessonId?: string) => set({ lessonId: lessonId ?? continueLessonId(getBucket()), view: 'dialog' }),
    selectLesson: (lessonId: string) => {
      setLastLesson(lessonId);
      set({ lessonId });
    },
  })),
);
