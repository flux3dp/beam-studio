import { DEFAULT_CONTROLLER_INCH, DEFAULT_CONTROLLER_MM } from '@core/app/constants/boxgen-constants';
import type { IController } from '@core/interfaces/IBoxgen';

import { useBoxgenStore } from './boxgenStore';
// storageStore is auto-mocked via __mocks__; use its setter to toggle units
import { setStorage } from './storageStore';

describe('boxgenStore', () => {
  afterEach(() => {
    // restore units back to mm (default) for other tests
    setStorage('default-units', 'mm');
  });

  it('should initialize with the mm controller by default', () => {
    expect(useBoxgenStore.getState().boxData).toEqual(DEFAULT_CONTROLLER_MM);
  });

  it('should replace boxData when setBoxData receives an object', () => {
    const next: IController = { ...DEFAULT_CONTROLLER_MM, depth: 123, width: 200 };

    useBoxgenStore.getState().setBoxData(next);
    expect(useBoxgenStore.getState().boxData).toEqual(next);
  });

  it('should support the updater-function form of setBoxData', () => {
    useBoxgenStore.getState().setBoxData((prev) => ({ ...prev, height: 999 }));
    expect(useBoxgenStore.getState().boxData.height).toBe(999);
    // other fields preserved
    expect(useBoxgenStore.getState().boxData.width).toBe(DEFAULT_CONTROLLER_MM.width);
  });

  it('should merge partial fields with updateBoxData', () => {
    useBoxgenStore.getState().updateBoxData({ cover: false, width: 50 });
    expect(useBoxgenStore.getState().boxData.width).toBe(50);
    expect(useBoxgenStore.getState().boxData.cover).toBe(false);
    expect(useBoxgenStore.getState().boxData.depth).toBe(DEFAULT_CONTROLLER_MM.depth);
  });

  it('should reset back to the mm controller', () => {
    useBoxgenStore.getState().updateBoxData({ width: 12345 });
    useBoxgenStore.getState().reset();
    expect(useBoxgenStore.getState().boxData).toEqual(DEFAULT_CONTROLLER_MM);
  });

  it('should never mutate the shared default controller constants', () => {
    // getInitialBoxData returns the DEFAULT_CONTROLLER_MM constant itself (no clone), so an
    // in-place merge bug (e.g. Object.assign(state.boxData, partial)) would permanently
    // corrupt the default for every subsequent Boxgen session — and reset() would then
    // "restore" the corrupted object, making the bug invisible to the reset tests above.
    const pristine = JSON.parse(JSON.stringify(DEFAULT_CONTROLLER_MM));

    useBoxgenStore.getState().updateBoxData({ cover: false, width: 777 });
    useBoxgenStore.getState().setBoxData((prev) => ({ ...prev, height: 888 }));

    expect(DEFAULT_CONTROLLER_MM).toEqual(pristine);
  });

  it('should reset to the inch controller when units are inches', () => {
    setStorage('default-units', 'inches');
    useBoxgenStore.getState().reset();
    expect(useBoxgenStore.getState().boxData).toEqual(DEFAULT_CONTROLLER_INCH);
  });
});
