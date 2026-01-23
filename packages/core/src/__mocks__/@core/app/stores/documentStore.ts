import type { DocumentState } from '@core/interfaces/Preference';
import { CHUCK_ROTARY_DIAMETER, RotaryType } from '@core/app/constants/addOn';

const state: DocumentState = {
  'auto-feeder': false,
  'auto-feeder-scale': 1,
  auto_shrink: false,
  borderless: false,
  'customized-dimension': { fpm1: { height: 150, width: 150 } },
  'enable-4c': false,
  'enable-1064': false,
  'enable-job-origin': false,
  'extend-rotary-workarea': false,
  'frame-before-start': false,
  'job-origin': 1,
  'pass-through': false,
  'promark-safety-door': false,
  'promark-start-button': false,
  'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER,
  'rotary-mirror': false,
  'rotary-overlap': 0,
  'rotary-scale': 1,
  'rotary-split': 0.05,
  'rotary-type': RotaryType.Roller,
  'rotary-y': null,
  rotary_mode: false,
  skip_prespray: false,
  workarea: 'fbb1b',
};

const set = <K extends keyof DocumentState>(key: K, value: DocumentState[K]) => {
  state[key] = value;
};

const update = (payload: Partial<DocumentState>) => {
  Object.assign(state, payload);
};

export const useDocumentStore = (selector?: (state: DocumentState) => Partial<DocumentState>) => {
  const allStates = { ...state, set, update };

  return selector ? selector(allStates) : allStates;
};

useDocumentStore.getState = () => ({ ...state, set, update });
useDocumentStore.setState = (newState: Partial<DocumentState>) => {
  Object.assign(state, newState);
};
