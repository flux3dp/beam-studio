jest.unmock('@core/app/constants/presets');

type FakeLayer = { attrs: Record<string, unknown> };

const mockApplyPreset = jest.fn();
const mockClamp = jest.fn();
const mockSetOverride = jest.fn();
const mockWriteDataLayer = jest.fn((layer: FakeLayer, key: string, value: unknown) => {
  layer.attrs[key] = value;
});

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  applyPreset: (...args: unknown[]) => mockApplyPreset(...args),
  clampLayerConfigLimits: (...args: unknown[]) => mockClamp(...args),
  getData: (layer: FakeLayer, key: string) => layer?.attrs?.[key],
  setPostPresetChangeOverride: (...args: unknown[]) => mockSetOverride(...args),
  writeDataLayer: (layer: FakeLayer, key: string, value: unknown, opts?: unknown) =>
    mockWriteDataLayer(layer, key, value, opts),
}));

jest.mock('@core/helpers/presets/preset-helper', () => ({
  getPresetModel: (model: string) => model,
}));

const mockCheckTutorial = jest.fn();

jest.mock('@core/helpers/presets/preset-tutorial', () => ({
  checkPresetTutorialStep: (...args: unknown[]) => mockCheckTutorial(...args),
}));

const mockGetAllLayers = jest.fn(() => [] as Array<{ getGroup: () => FakeLayer }>);

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getAllLayers: () => mockGetAllLayers(),
}));

const mockIsActive = jest.fn(() => true);

jest.mock('@core/helpers/materials/isMaterialBrowserActive', () => ({
  isMaterialBrowserActive: () => mockIsActive(),
}));

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useMaterialStore } from '@core/app/stores/materialStore';
import { materialCatalogCache } from '@core/helpers/api/material-catalog/materialCatalogCache';

import {
  applyMaterialPreset,
  initMaterialApply,
  postMaterialPresetChange,
  resetMaterialApplyInit,
  resolveLayerMaterialRef,
  toLegacyPreset,
} from './material-apply';

const layer = (attrs: Record<string, unknown> = {}): FakeLayer => ({ attrs });

describe('material-apply', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMaterialApplyInit();
    mockIsActive.mockReturnValue(true);
    useDocumentStore.setState({ workarea: 'fbb2' } as never);
  });

  describe('applyMaterialPreset', () => {
    test('funnels through applyPreset, stamps refs, records recent + tutorial; no dpi write for undeclared presets', () => {
      const hit = materialCatalogCache.findPresetById('wood_3mm_cutting')!;
      const target = layer({ module: LayerModule.LASER_UNIVERSAL });

      applyMaterialPreset(hit.material, hit.preset, { layers: [target as never] });

      // wood_3mm_cutting declares no dpi — the layer's DPI stays whatever the user set
      expect(target.attrs.dpi).toBeUndefined();
      expect(target.attrs.materialId).toBe('wood-3mm');
      expect(target.attrs.presetId).toBe('wood_3mm_cutting');

      expect(mockApplyPreset).toHaveBeenCalledTimes(1);

      const [, legacy] = mockApplyPreset.mock.calls[0];

      expect(legacy).toMatchObject({
        isDefault: true,
        key: 'wood_3mm_cutting',
        module: LayerModule.LASER_UNIVERSAL,
      });
      expect(legacy.power).toBeDefined();

      expect(useMaterialStore.getState().recents[0]).toMatchObject({
        materialId: 'wood-3mm',
        presetId: 'wood_3mm_cutting',
      });
      expect(mockCheckTutorial).toHaveBeenCalledWith({ isDefault: true, key: 'wood_3mm_cutting' });
    });

    test('dpi-declaring entries write dpi before the parameter pass (quality tiers)', () => {
      useDocumentStore.setState({ workarea: 'fhx2rf_30' } as never);

      const hit = materialCatalogCache.findPresetById('wood_engraving_high')!;
      const target = layer({ module: LayerModule.LASER_UNIVERSAL });

      applyMaterialPreset(hit.material, hit.preset, { layers: [target as never] });

      const writes = mockWriteDataLayer.mock.calls.map(([, key]) => key);

      // dpi lands first so applyPreset resolves dpiOverrides against the new value
      expect(writes.indexOf('dpi')).toBeLessThan(writes.indexOf('materialId'));
      expect(target.attrs.dpi).toBe('high');
      // dpiOverrides ride along verbatim for applyPreset to resolve
      expect(mockApplyPreset.mock.calls[0][1].dpiOverrides).toBeDefined();
    });

    test('merges the [Customized] overlay into applied values', () => {
      const hit = materialCatalogCache.findPresetById('wood_3mm_cutting')!;

      useMaterialStore.getState().updatePreset('wood-3mm', 'wood_3mm_cutting', 'fbb2', '15', { power: 61 });

      const target = layer({ module: LayerModule.LASER_UNIVERSAL });

      applyMaterialPreset(hit.material, hit.preset, { layers: [target as never] });

      expect(mockApplyPreset.mock.calls[0][1].power).toBe(61);
    });

    test('skips layers whose module has no settings', () => {
      const hit = materialCatalogCache.findPresetById('wood_3mm_cutting')!;
      const printerLayer = layer({ module: LayerModule.PRINTER });

      applyMaterialPreset(hit.material, hit.preset, { layers: [printerLayer as never] });

      expect(mockApplyPreset).not.toHaveBeenCalled();
      expect(printerLayer.attrs.presetId).toBeUndefined();
    });
  });

  describe('toLegacyPreset', () => {
    test('user preset maps to non-default with display name', () => {
      const legacy = toLegacyPreset(
        { id: 'user_1', name: 'Deep Cut', origin: 'user', settings: {} },
        { power: 80 },
        LayerModule.LASER_UNIVERSAL,
      );

      expect(legacy).toMatchObject({ isDefault: false, key: 'user_1', name: 'Deep Cut', power: 80 });
    });
  });

  describe('resolveLayerMaterialRef', () => {
    test('presetId attr wins; configName legacyKey fallback; user-name fallback; null otherwise', () => {
      expect(resolveLayerMaterialRef(layer({ presetId: 'wood_engraving' }) as never)!.preset.id).toBe('wood_engraving');

      const byConfigName = resolveLayerMaterialRef(layer({ configName: 'wood_3mm_cutting' }) as never);

      expect(byConfigName!.preset.legacyKey).toBe('wood_3mm_cutting');
      expect(byConfigName!.material.id).toBe('wood-3mm');

      useMaterialStore.getState().addMaterial({
        category: 'other',
        id: 'm1',
        name: 'M1',
        presets: [{ id: 'user_p', name: 'My Cut', origin: 'user', settings: { '*': { '*': { power: 1 } } } }],
        source: 'user',
      });
      expect(resolveLayerMaterialRef(layer({ configName: 'My Cut' }) as never)!.preset.id).toBe('user_p');

      expect(resolveLayerMaterialRef(layer({ configName: ' ' }) as never)).toBeNull();
      expect(resolveLayerMaterialRef(layer({}) as never)).toBeNull();
    });
  });

  describe('postMaterialPresetChange', () => {
    test('re-applies resolvable refs without renaming and persists refs', () => {
      const target = layer({ configName: 'wood_3mm_cutting', module: LayerModule.LASER_UNIVERSAL });

      mockGetAllLayers.mockReturnValue([{ getGroup: () => target }]);
      postMaterialPresetChange();

      expect(mockApplyPreset).toHaveBeenCalledTimes(1);
      expect(mockApplyPreset.mock.calls[0][2]).toMatchObject({ applyName: false });
      expect(target.attrs.presetId).toBe('wood_3mm_cutting');
      expect(target.attrs.materialId).toBe('wood-3mm');
      expect(mockClamp).toHaveBeenCalledWith(target);
    });

    test('degrades unresolvable refs to Manual keeping raw params', () => {
      const target = layer({
        configName: 'gone_preset',
        module: LayerModule.LASER_UNIVERSAL,
        power: 33,
        presetId: 'gone_preset',
      });

      mockGetAllLayers.mockReturnValue([{ getGroup: () => target }]);
      postMaterialPresetChange();

      expect(mockApplyPreset).not.toHaveBeenCalled();
      expect(target.attrs.presetId).toBeUndefined();
      expect(target.attrs.materialId).toBeUndefined();
      expect(target.attrs.configName).toBeUndefined();
      expect(target.attrs.power).toBe(33);
      expect(mockClamp).toHaveBeenCalled();
    });

    test('respects the layer DPI on context changes (no dpi write, even for dpi-declaring refs)', () => {
      useDocumentStore.setState({ workarea: 'fhx2rf_30' } as never);

      // User applied the 500 DPI tier, then tuned the layer down to medium via DpiBlock
      const target = layer({ dpi: 'medium', module: LayerModule.LASER_UNIVERSAL, presetId: 'wood_engraving_high' });

      mockGetAllLayers.mockReturnValue([{ getGroup: () => target }]);
      postMaterialPresetChange();

      expect(mockApplyPreset).toHaveBeenCalledTimes(1);
      expect(target.attrs.dpi).toBe('medium');
    });

    test('degrades refs with no settings for the current module', () => {
      // wood_3mm_cutting has no printing scopes
      const target = layer({ module: LayerModule.PRINTER, presetId: 'wood_3mm_cutting' });

      mockGetAllLayers.mockReturnValue([{ getGroup: () => target }]);
      postMaterialPresetChange();

      expect(mockApplyPreset).not.toHaveBeenCalled();
      expect(target.attrs.presetId).toBeUndefined();
    });
  });

  describe('initMaterialApply', () => {
    test('registers the override when active, deregisters when inactive', () => {
      initMaterialApply();
      expect(mockSetOverride).toHaveBeenCalledWith(postMaterialPresetChange);

      mockIsActive.mockReturnValue(false);
      resetMaterialApplyInit();
      mockSetOverride.mockClear();
      initMaterialApply();
      expect(mockSetOverride).not.toHaveBeenCalledWith(postMaterialPresetChange);
    });
  });
});
