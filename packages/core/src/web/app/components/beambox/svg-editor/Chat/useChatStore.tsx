import { create } from 'zustand';
import { combine } from 'zustand/middleware';

type State = {
  isChatShown: boolean;
};

type Action = {
  setIsChatShown: (isChatShown: boolean) => void;
};

export const useChatStore = create<Action & State>(
  combine({ isChatShown: false }, (set) => ({
    setIsChatShown: (isChatShown) => {
      set({ isChatShown });
    },
  })),
);
