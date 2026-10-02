// Mirrors the real default config: every "Various"-check field has a default,
// while materialId/presetId deliberately do NOT (the bug this spec guards against).
const mockGetDefaultConfig = jest.fn(() => ({
  configName: '',
  diode: 0,
  ink: 3,
  module: 15,
  multipass: 3,
  power: 15,
  repeat: 1,
  speed: 20,
  zStep: 0,
}));

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getDefaultConfig: () => mockGetDefaultConfig(),
}));

const mockResolveMaterialRef = jest.fn();
const mockResolveWithOverlay = jest.fn();

jest.mock('@core/helpers/materials/material-apply', () => ({
  resolveMaterialRef: (...args: unknown[]) => mockResolveMaterialRef(...args),
  resolveWithOverlay: (...args: unknown[]) => mockResolveWithOverlay(...args),
}));

jest.mock('@core/helpers/presets/preset-helper', () => ({
  getPresetModel: (model: string) => model,
}));

import { act, renderHook } from '@testing-library/react';

import { useConfigPanelStore } from '@core/app/stores/configPanel';

import { useAppliedMaterial } from './useAppliedMaterial';

const material = { category: 'wood', id: 'wood-3mm', presets: [] };
const preset = { id: 'wood_3mm_cutting', legacyKey: 'wood_3mm_cutting', origin: 'default', settings: {} };

describe('useAppliedMaterial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveMaterialRef.mockReturnValue(null);
  });

  test('pre-hydration default store state does not crash (presetId/materialId have no default config)', () => {
    const { result } = renderHook(() => useAppliedMaterial());

    expect(result.current).toEqual({ applied: null, isVarious: false });
    expect(mockResolveMaterialRef).toHaveBeenCalledWith({ configName: '', presetId: undefined });
  });

  test('resolves applied material and modified state', () => {
    mockResolveMaterialRef.mockReturnValue({ material, preset });
    mockResolveWithOverlay.mockReturnValue({ power: 55, speed: 7 });

    const { rerender, result } = renderHook(() => useAppliedMaterial());

    act(() =>
      useConfigPanelStore
        .getState()
        .change({ configName: 'wood_3mm_cutting', power: 55, presetId: 'wood_3mm_cutting', speed: 7 } as never),
    );
    rerender();

    expect(result.current.applied).toMatchObject({ isModified: false, material, preset });

    // Diverge one live parameter → modified dot
    act(() => useConfigPanelStore.getState().change({ power: 60 } as never));
    rerender();

    expect(result.current.applied?.isModified).toBe(true);
  });

  test('the declared dpi never flags modified — only parameter deviations do', () => {
    mockResolveMaterialRef.mockReturnValue({ material, preset });
    // Flat per-DPI preset: values already merged at its declared 500 DPI
    mockResolveWithOverlay.mockReturnValue({ dpi: 'high', power: 25, speed: 7 });

    const { rerender, result } = renderHook(() => useAppliedMaterial());

    act(() =>
      useConfigPanelStore.getState().change({
        configName: 'Engraving',
        dpi: 'high',
        power: 25,
        presetId: 'wood_engraving_high',
        speed: 7,
      } as never),
    );
    rerender();

    expect(result.current.applied?.isModified).toBe(false);

    // Tuning the layer DPI away from the declared one is a layer property, not a deviation
    act(() => useConfigPanelStore.getState().change({ dpi: 'medium' } as never));
    rerender();
    expect(result.current.applied?.isModified).toBe(false);

    act(() => useConfigPanelStore.getState().change({ power: 30 } as never));
    rerender();
    expect(result.current.applied?.isModified).toBe(true);
  });

  test('mixed multi-selection reports Various without resolving', () => {
    act(() => useConfigPanelStore.getState().update({ power: { hasMultiValue: true, value: 20 } } as never));

    const { result } = renderHook(() => useAppliedMaterial());

    expect(result.current).toEqual({ applied: null, isVarious: true });
    expect(mockResolveMaterialRef).not.toHaveBeenCalled();
  });
});
