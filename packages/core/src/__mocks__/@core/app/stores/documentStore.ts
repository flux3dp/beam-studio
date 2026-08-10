import type { DocumentState } from '@core/interfaces/Preference';
import { CHUCK_ROTARY_DIAMETER, RotaryType } from '@core/app/constants/addOn';
import { DEFAULT_MATERIAL, DEFAULT_SAFETY_MARGIN } from '@core/app/constants/innerEngraving';

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
  'inner-engraving': false,
  'inner-engraving-depth': DEFAULT_MATERIAL.depth,
  'inner-engraving-diameter': DEFAULT_MATERIAL.diameter,
  'inner-engraving-height': DEFAULT_MATERIAL.height,
  'inner-engraving-refractive-index': DEFAULT_MATERIAL.refractiveIndex,
  'inner-engraving-safety-margin': DEFAULT_SAFETY_MARGIN,
  'inner-engraving-shape': DEFAULT_MATERIAL.shape,
  'inner-engraving-width': DEFAULT_MATERIAL.width,
  'inner-engraving-x': DEFAULT_MATERIAL.x,
  'inner-engraving-y': DEFAULT_MATERIAL.y,
  'job-origin': 1,
  'pass-through': false,
  prespray_times: 3,
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
  'workarea-annotation': {},
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
useDocumentStore.subscribe = jest.fn();
