import { create } from 'zustand';
import { combine, subscribeWithSelector } from 'zustand/middleware';

import communicator from '@core/implementations/communicator';
import storage from '@core/implementations/storage';
import type { IBatchCommand, ICommand } from '@core/interfaces/IHistory';
import type { BeamboxPreference, DocumentState, DocumentStateKey } from '@core/interfaces/Preference';

import beamboxPreference from '../actions/beambox/beambox-preference';
import { getAddOnInfo } from '../constants/addOn';
import { TabEvents } from '../constants/tabConstants';
import { changeBeamboxPreferenceValue } from '../svgedit/history/beamboxPreferenceCommand';
import history, { BaseHistoryCommand } from '../svgedit/history/history';

export type DocumentStore = DocumentState & {
  reload: () => void;
  set: <K extends keyof DocumentState>(key: K, value: DocumentState[K]) => void;
  update: (payload: Partial<DocumentState>) => void;
};

const getInitDocumentStore = (): DocumentState => {
  const preference = storage.get('beambox-preference', false) as BeamboxPreference;
  const defaultWorkarea = preference.model;
  const addOnInfo = getAddOnInfo(defaultWorkarea);
  const isAutofocusEnabled = Boolean(preference['default-autofocus'] && addOnInfo.autoFocus);
  const isDiodeEnabled = Boolean(preference['default-diode'] && addOnInfo.hybridLaser);
  const isBorderlessEnabled = Boolean(preference['default-borderless'] && addOnInfo.openBottom);
  const isRotaryEnabled = Boolean(preference.rotary_mode && addOnInfo.rotary);

  // Write default values to BeamboxPreference, may not need because the value will always reset by getInitDocumentStore
  beamboxPreference.write('workarea', defaultWorkarea, false);
  beamboxPreference.write('enable-autofocus', isAutofocusEnabled, false);
  beamboxPreference.write('enable-diode', isDiodeEnabled, false);
  beamboxPreference.write('borderless', isBorderlessEnabled, false);
  beamboxPreference.write('rotary_mode', isRotaryEnabled, false);

  return {
    'auto-feeder': preference['auto-feeder'],
    'auto-feeder-height': preference['auto-feeder-height'],
    'auto-feeder-scale': preference['auto-feeder-scale'],
    auto_shrink: preference.auto_shrink,
    borderless: isBorderlessEnabled,
    'customized-dimension': preference['customized-dimension'],
    'enable-autofocus': isAutofocusEnabled,
    'enable-diode': isDiodeEnabled,
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
    rotary_mode: isRotaryEnabled,
    workarea: defaultWorkarea,
  };
};

/**
 * Document Store stores the states in BeamboxPreference which are not shared by all tabs.
 */
export const useDocumentStore = create(
  subscribeWithSelector<DocumentStore>(
    combine(getInitDocumentStore(), (set) => ({
      reload: () => set(getInitDocumentStore()),

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

communicator.on(TabEvents.ReloadDocumentStore, () => {
  useDocumentStore.getState().reload();
});

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
