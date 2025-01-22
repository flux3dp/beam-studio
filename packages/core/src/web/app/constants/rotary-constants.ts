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
};

export default rotaryConstants;
