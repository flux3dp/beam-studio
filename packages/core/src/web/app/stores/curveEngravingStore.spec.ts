import { setCurveEngravingState, useCurveEngravingStore } from './curveEngravingStore';

describe('curveEngravingStore', () => {
  it('should have the default state on init', () => {
    expect(useCurveEngravingStore.getState()).toEqual({ hasData: false, maxAngle: 0 });
  });

  it('should update partial state via setCurveEngravingState', () => {
    setCurveEngravingState({ hasData: true });
    expect(useCurveEngravingStore.getState()).toEqual({ hasData: true, maxAngle: 0 });

    setCurveEngravingState({ maxAngle: 45 });
    expect(useCurveEngravingStore.getState()).toEqual({ hasData: true, maxAngle: 45 });
  });

  it('should notify selector subscribers when the selected slice changes', () => {
    const listener = jest.fn();
    const unsubscribe = useCurveEngravingStore.subscribe((state) => state.maxAngle, listener);

    setCurveEngravingState({ maxAngle: 30 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(30, 0);

    // change to a different slice should not fire the maxAngle subscription
    setCurveEngravingState({ hasData: true });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    setCurveEngravingState({ maxAngle: 90 });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
