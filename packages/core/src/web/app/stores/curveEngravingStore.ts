import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface CurveEngravingState {
  hasData: boolean;
  maxAngle: number;
}

export const useCurveEngravingStore = create(
  subscribeWithSelector<CurveEngravingState>(() => ({
    hasData: false,
    maxAngle: 0,
  })),
);

/**
 * for updating the curve engraving state outside React components
 * @param state Partial<CurveEngravingState>
 * @returns void
 */
export const setCurveEngravingState = (state: Partial<CurveEngravingState>) => {
  useCurveEngravingStore.setState(state);
};
