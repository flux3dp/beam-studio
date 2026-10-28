import storage from '@core/implementations/storage';

import { approachPoints, BACKLASH_OVERSHOOT_MM, getFixBacklash, setFixBacklash } from './backlash';

describe('galvoCalibration backlash', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.set('galvo-fix-backlash', undefined);
  });

  it('defaults the flag to on and stores a change', () => {
    expect(getFixBacklash()).toBe(true);
    setFixBacklash(false);
    expect(getFixBacklash()).toBe(false);
  });

  it('goes straight there when the fix is off', () => {
    expect(approachPoints({ x: 10, y: 10 }, { fix: false, from: { x: 20, y: 20 } })).toEqual([{ x: 10, y: 10 }]);
  });

  it('overshoots only the axes that would be approached from the positive side', () => {
    expect(approachPoints({ x: 10, y: 30 }, { fix: true, from: { x: 20, y: 20 } })).toEqual([
      { x: 10 - BACKLASH_OVERSHOOT_MM, y: 30 },
      { x: 10, y: 30 },
    ]);
    expect(approachPoints({ x: 30, y: 30 }, { fix: true, from: { x: 20, y: 20 } })).toEqual([{ x: 30, y: 30 }]);
  });

  it('overshoots both axes when the current position is unknown', () => {
    expect(approachPoints({ x: 100, y: 100 }, { fix: true })).toEqual([
      { x: 95, y: 95 },
      { x: 100, y: 100 },
    ]);
  });

  it('never overshoots below the near edge of the travel', () => {
    expect(approachPoints({ x: 2, y: 3 }, { fix: true, min: { x: 0, y: 1 } })).toEqual([
      { x: 0, y: 1 },
      { x: 2, y: 3 },
    ]);
    expect(approachPoints({ x: 0, y: 0 }, { fix: true })).toEqual([{ x: 0, y: 0 }]);
  });
});
