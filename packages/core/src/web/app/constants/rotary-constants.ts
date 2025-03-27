import beamboxPreference from '@core/app/actions/beambox/beambox-preference';

import type { WorkAreaModel } from './workarea-constants';

// all unit in mm
export interface RotaryConstants {
  boundary?: number[];
  maxHeight: number;
}

const rotaryConstants: { [key in WorkAreaModel]?: RotaryConstants } = {
  ado1: {
    boundary: [0, 300],
    maxHeight: 140,
  },
  fbb2: {
    boundary: [0, 375],
    maxHeight: 1625,
  },
  get fpm1() {
    const height = beamboxPreference.read('customized-dimension')?.fpm1?.height || 150;

    return { boundary: [0, height], maxHeight: 500 - height };
  },
};

export default rotaryConstants;
