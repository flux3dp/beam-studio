import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { setCurveEngravingState, useCurveEngravingStore } from '@core/app/stores/curveEngravingStore';

import { type AddOnModeContext, type AddOnModeMutationOptions, resolveAddOnInfo } from './types';

let clearRuntimeData = (): void => {
  setCurveEngravingState({ hasData: false, maxAngle: 0 });

  if (useCanvasStore.getState().mode === CanvasMode.CurveEngraving) {
    useCanvasStore.getState().setMode(CanvasMode.Draw);
  }
};

export const registerCurveEngravingRuntimeCleanup = (cleanup: () => void): void => {
  clearRuntimeData = cleanup;
};

export const checkCurveEngraving = (context: AddOnModeContext = {}): boolean =>
  Boolean(resolveAddOnInfo(context)?.curveEngraving);

/** Whether curve engraving is supported and has an active editor session or measured data. */
export const getCurveEngraving = (context: AddOnModeContext = {}): boolean =>
  checkCurveEngraving(context) &&
  (useCurveEngravingStore.getState().hasData || useCanvasStore.getState().mode === CanvasMode.CurveEngraving);

// Curve engraving is enabled by its controller's start/loadData flows; there is no document flag.
export const enableCurveEngraving = (options: AddOnModeMutationOptions = {}): void => {
  void options;
};

export const disableCurveEngraving = ({ applyRuntime = true }: AddOnModeMutationOptions = {}): void => {
  if (!applyRuntime) return;

  const hasRuntimeData =
    useCurveEngravingStore.getState().hasData || useCanvasStore.getState().mode === CanvasMode.CurveEngraving;

  if (hasRuntimeData) clearRuntimeData();
};
