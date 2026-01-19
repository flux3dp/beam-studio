import { useDocumentStore } from '@core/app/stores/documentStore';

import type { WorkAreaModel } from './workarea-constants';

// all unit in mm
export interface RotaryConstants {
  boundary?: number[];
  maxHeight: number;
}

const rotaryConstants: { [key in WorkAreaModel]?: RotaryConstants } = {
  ado1: {
    boundary: [0, 300],
    maxHeight: 200,
  },
  fbb2: {
    boundary: [0, 375],
    maxHeight: 1625,
  },
  fbm1: {
    maxHeight: 290,
  },
  fbm2: {
    boundary: [0, 240],
    maxHeight: 290,
  },
  get fpm1() {
    const height = useDocumentStore.getState()['customized-dimension']?.fpm1?.height || 150;

    return { boundary: [0, height], maxHeight: 500 - height };
  },
};

export default rotaryConstants;
