import { create } from 'zustand';

import type { ICommand } from '@core/interfaces/IHistory';

import { BaseHistoryCommand } from '../../history/history';

type State = {
  counter: number;
  signature: null | string;
};

type Action = {
  reset: (initialSignature?: null | string) => void;
  set: <K extends keyof State>(key: K, value: State[K]) => void;
  updateSignature: (newSignature: string) => void;
};

export const useClipboardStore = create<Action & State>((set, get) => ({
  counter: 0,
  reset: (initialSignature = null) => set({ counter: 0, signature: initialSignature }),
  set: (key, value) => set({ [key]: value }),
  signature: null,
  updateSignature: (newSignature) => {
    const { counter, signature } = get();

    set({ counter: newSignature === signature ? counter + 1 : 0, signature: newSignature });
  },
}));

export class updateSignatureClipboardCommand extends BaseHistoryCommand implements ICommand {
  type = () => 'updateSignatureClipboardCommand';
  elements = () => [];
  oldState: State = { counter: 0, signature: null };

  constructor(private newSignature: string = '') {
    super();
    this.oldState = {
      counter: useClipboardStore.getState().counter,
      signature: useClipboardStore.getState().signature,
    };
  }

  doApply = (): void => {
    useClipboardStore.getState().updateSignature(this.newSignature);
  };

  doUnapply = (): void => {
    useClipboardStore.getState().set('counter', this.oldState.counter);
    useClipboardStore.getState().set('signature', this.oldState.signature);
  };
}
