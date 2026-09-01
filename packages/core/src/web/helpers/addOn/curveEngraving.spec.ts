import type { AddOnInfo } from '@core/app/constants/addOn';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useCurveEngravingStore } from '@core/app/stores/curveEngravingStore';

import {
  checkCurveEngraving,
  disableCurveEngraving,
  getCurveEngraving,
  registerCurveEngravingRuntimeCleanup,
} from './curveEngraving';

const addOnInfo = { curveEngraving: {} } as AddOnInfo;

describe('curve engraving add-on', () => {
  beforeEach(() => {
    useCanvasStore.setState({ mode: CanvasMode.Draw });
    useCurveEngravingStore.setState({ hasData: false, maxAngle: 0 });
  });

  test('checks capability separately from its runtime state', () => {
    expect(checkCurveEngraving({ addOnInfo })).toBe(true);
    expect(getCurveEngraving({ addOnInfo })).toBe(false);

    useCurveEngravingStore.setState({ hasData: true });
    expect(getCurveEngraving({ addOnInfo })).toBe(true);

    useCurveEngravingStore.setState({ hasData: false });
    useCanvasStore.setState({ mode: CanvasMode.CurveEngraving });
    expect(getCurveEngraving({ addOnInfo })).toBe(true);
  });

  test('clears controller runtime data only for live mutations', () => {
    const cleanup = jest.fn();

    registerCurveEngravingRuntimeCleanup(cleanup);
    useCurveEngravingStore.setState({ hasData: true });
    disableCurveEngraving({ applyRuntime: false });
    expect(cleanup).not.toHaveBeenCalled();

    disableCurveEngraving();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
