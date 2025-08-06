import { create } from 'zustand';
import { combine, subscribeWithSelector } from 'zustand/middleware';

import type { BeamboxPreference } from '@core/app/actions/beambox/beambox-preference';
import storage from '@core/implementations/storage';
import type { IBatchCommand, ICommand } from '@core/interfaces/IHistory';

import beamboxPreference from '../actions/beambox/beambox-preference';
import { changeBeamboxPreferenceValue } from '../svgedit/history/beamboxPreferenceCommand';
import history, { BaseHistoryCommand } from '../svgedit/history/history';

export type DocumentState = Pick<
  BeamboxPreference,
  | 'auto-feeder'
  | 'auto-feeder-height'
  | 'auto-feeder-scale'
  | 'auto_shrink'
  | 'borderless'
  | 'customized-dimension'
  | 'enable-autofocus'
  | 'enable-diode'
  | 'enable-job-origin'
  | 'engrave_dpi'
  | 'extend-rotary-workarea'
  | 'frame-before-start'
  | 'job-origin'
  | 'pass-through'
  | 'pass-through-height'
  | 'promark-safety-door'
  | 'promark-start-button'
  | 'rotary-chuck-obj-d'
  | 'rotary-mirror'
  | 'rotary-overlap'
  | 'rotary-scale'
  | 'rotary-split'
  | 'rotary-type'
  | 'rotary-y'
  | 'rotary_mode'
  | 'workarea'
>;

export type DocumentStateKey = keyof DocumentState;

export type DocumentStore = DocumentState & {
  reload: () => void;
  set: <K extends keyof DocumentState>(key: K, value: DocumentState[K]) => void;
  update: (payload: Partial<DocumentState>) => void;
};

const getInitDocumentStore = (): DocumentState => {
  const preference = storage.get('beambox-preference', false) as BeamboxPreference;

  return {
    'auto-feeder': preference['auto-feeder'],
    'auto-feeder-height': preference['auto-feeder-height'],
    'auto-feeder-scale': preference['auto-feeder-scale'],
    auto_shrink: preference.auto_shrink,
    borderless: preference.borderless,
    'customized-dimension': preference['customized-dimension'],
    'enable-autofocus': preference['default-autofocus'],
    'enable-diode': preference['default-diode'],
    'enable-job-origin': preference['enable-job-origin'],
    engrave_dpi: preference.engrave_dpi,
    'extend-rotary-workarea': preference['extend-rotary-workarea'],
    'frame-before-start': preference['frame-before-start'],
    'job-origin': preference['job-origin'],
    'pass-through': preference['pass-through'],
    'pass-through-height': preference['pass-through-height'],
    'promark-safety-door': preference['promark-safety-door'],
    'promark-start-button': preference['promark-start-button'],
    'rotary-chuck-obj-d': preference['rotary-chuck-obj-d'],
    'rotary-mirror': preference['rotary-mirror'],
    'rotary-overlap': preference['rotary-overlap'],
    'rotary-scale': preference['rotary-scale'],
    'rotary-split': preference['rotary-split'],
    'rotary-type': preference['rotary-type'],
    'rotary-y': preference['rotary-y'],
    rotary_mode: preference.rotary_mode,
    workarea: preference.workarea,
  };
};

/**
 * Document Store stores the states in BeamboxPreference which are not shared by all tabs.
 */
export const useDocumentStore = create(
  subscribeWithSelector<DocumentStore>(
    combine(getInitDocumentStore(), (set) => ({
      reload: () => {
        set(getInitDocumentStore());
      },

      set: <K extends keyof DocumentState>(key: K, value: DocumentState[K]) => {
        set(() => {
          beamboxPreference.write(key, value as any, false);

          return { [key]: value };
        });
      },

      update: (payload: Partial<DocumentState>) => {
        set(() => {
          for (const [key, value] of Object.entries(payload)) {
            beamboxPreference.write(key as DocumentStateKey, value as any, false);
          }

          return payload;
        });
      },
    })),
  ),
);

export class DocumentStoreCommand<Key extends DocumentStateKey> extends BaseHistoryCommand implements ICommand {
  elements = () => [];

  type = () => 'DocumentStoreCommand';

  constructor(
    private key: Key,
    private oldValue: DocumentState[Key],
    private newValue: DocumentState[Key],
  ) {
    super();
  }

  doApply = (): void => {
    useDocumentStore.getState().set(this.key, this.newValue);
  };

  doUnapply = (): void => {
    useDocumentStore.getState().set(this.key, this.oldValue);
  };
}

export function changeDocumentStoreValue<Key extends DocumentStateKey>(
  key: Key,
  value: DocumentState[Key],
  { changeBeamboxPreference = true, parentCmd }: { changeBeamboxPreference?: boolean; parentCmd?: IBatchCommand } = {},
): ICommand {
  const store = useDocumentStore.getState();
  const oldValue = store[key];

  store.set(key, value);

  let cmd: ICommand = new DocumentStoreCommand(key, oldValue, value);

  if (changeBeamboxPreference) {
    const batchCmd = new history.BatchCommand();

    batchCmd.addSubCommand(cmd);
    changeBeamboxPreferenceValue(key, value as any, { isGlobalPreference: false, parentCmd: batchCmd });
    cmd = batchCmd;
  }

  if (parentCmd) parentCmd.addSubCommand(cmd);

  return cmd;
}
