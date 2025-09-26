import { create } from 'zustand';
import { combine } from 'zustand/middleware';

type State = {
  isAiGenerateShown: boolean;
};

type Action = {
  setIsAiGenerateShown: (isAiGenerateShown: boolean) => void;
};

export const useAiGenerateStore = create<Action & State>(
  combine({ isAiGenerateShown: false }, (set) => ({
    setIsAiGenerateShown: (isAiGenerateShown) => {
      set({ isAiGenerateShown });
    },
  })),
);