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
  forcedKeys: ['speed', 'power', 'repeat'],
  getConfigKeys: () => ['speed', 'power', 'repeat', 'zStep'],
  getData: (layer: FakeLayer, key: string) => layer?.attrs?.[key],
  getDefaultConfig: () => ({ power: 15, repeat: 1, speed: 20, zStep: 0 }),
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
import { presets as defaultPresets } from '@core/app/constants/presets';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { resetMaterialStoreInit, useMaterialStore } from '@core/app/stores/materialStore';
import { materialCatalogCache } from '@core/helpers/api/material-catalog/materialCatalogCache';

import {
  applyMaterialPreset,
  initMaterialApply,
  initMaterialBrowser,
  postMaterialPresetChange,
  resetMaterialApplyInit,
  resolveLayerMaterialRef,
  stageMaterialPreset,
  switchPresetDpiGroup,
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
      expect(target.attrs.materialId).toBe('wood');
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
        materialId: 'wood',
        presetId: 'wood_3mm_cutting',
      });
      expect(mockCheckTutorial).toHaveBeenCalledWith({ isDefault: true, key: 'wood_3mm_cutting' });
    });

    test('dpi-declaring entries write their dpi; flat per-DPI presets carry merged values', () => {
      useDocumentStore.setState({ workarea: 'fhx2rf_30' } as never);

      const hit = materialCatalogCache.findPresetById('wood_engraving_high')!;
      const target = layer({ module: LayerModule.LASER_UNIVERSAL });

      applyMaterialPreset(hit.material, hit.preset, { layers: [target as never] });

      expect(target.attrs.dpi).toBe('high');
      expect(target.attrs.presetId).toBe('wood_engraving_high');

      // The catalog is flat: values already merged at this dpi, no dpiOverrides ride along
      const applied = mockApplyPreset.mock.calls[0][1];

      expect(applied.dpiOverrides).toBeUndefined();
      expect(applied.power).toBe(defaultPresets.wood_engraving.fhx2rf_30!['15']!.dpiOverrides!.high!.power);

      // The base entry applies its declared 250 DPI
      const base = layer({ module: LayerModule.LASER_UNIVERSAL });
      const baseHit = materialCatalogCache.findPresetById('wood_engraving')!;

      applyMaterialPreset(baseHit.material, baseHit.preset, { layers: [base as never] });
      expect(base.attrs.dpi).toBe('medium');
    });

    test('merges the [Customized] overlay into applied values', () => {
      const hit = materialCatalogCache.findPresetById('wood_3mm_cutting')!;

      useMaterialStore.getState().updatePreset('wood_3mm_cutting', 'fbb2', '15', { power: 61 });

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
      expect(byConfigName!.material.id).toBe('wood');

      useMaterialStore.getState().addMaterial({ category: 'other', id: 'm1', name: 'M1', presets: [], source: 'user' });
      useMaterialStore
        .getState()
        .addPreset('m1', { id: 'user_p', name: 'My Cut', origin: 'user', settings: { '*': { '*': { power: 1 } } } });
      expect(resolveLayerMaterialRef(layer({ configName: 'My Cut' }) as never)!.preset.id).toBe('user_p');

      expect(resolveLayerMaterialRef(layer({ configName: ' ' }) as never)).toBeNull();
      expect(resolveLayerMaterialRef(layer({}) as never)).toBeNull();
    });
  });

  describe('switchPresetDpiGroup', () => {
    test('switches to the group member declaring the new dpi, writing only differing keys', () => {
      useDocumentStore.setState({ workarea: 'fhx2rf_30' } as never);

      const sourceRf = defaultPresets.wood_engraving.fhx2rf_30!['15']!;
      const target = layer({
        module: LayerModule.LASER_UNIVERSAL,
        presetId: 'wood_engraving',
        // Manual tweak on a key the family agrees on — must survive the switch
        repeat: 5,
        speed: sourceRf.speed,
      });

      expect(switchPresetDpiGroup(target as never, 'high')).toBe(true);
      expect(target.attrs.presetId).toBe('wood_engraving_high');
      // Per-DPI presets have no legacyKey — the configName shadow uses the display name
      expect(target.attrs.configName).toBe('Engraving');
      expect(target.attrs.power).toBe(sourceRf.dpiOverrides!.high!.power);
      expect(target.attrs.repeat).toBe(5);

      // And back to the base, whose legacyKey is the presets.ts key
      expect(switchPresetDpiGroup(target as never, 'medium')).toBe(true);
      expect(target.attrs.presetId).toBe('wood_engraving');
      expect(target.attrs.configName).toBe('wood_engraving');
      expect(target.attrs.power).toBe(sourceRf.power);
    });

    test('no-op without a group, without a member for the dpi, or when already there', () => {
      useDocumentStore.setState({ workarea: 'fhx2rf_30' } as never);

      // Cutting presets have no per-DPI group
      const cutting = layer({ module: LayerModule.LASER_UNIVERSAL, presetId: 'wood_3mm_cutting' });

      expect(switchPresetDpiGroup(cutting as never, 'high')).toBe(false);
      expect(cutting.attrs.presetId).toBe('wood_3mm_cutting');

      // No member declares 'low'; params and ref stay
      const engraving = layer({ module: LayerModule.LASER_UNIVERSAL, presetId: 'wood_engraving' });

      expect(switchPresetDpiGroup(engraving as never, 'low')).toBe(false);
      expect(switchPresetDpiGroup(engraving as never, 'medium')).toBe(false);
      expect(engraving.attrs.presetId).toBe('wood_engraving');
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
      expect(target.attrs.materialId).toBe('wood');
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

      // User applied the 500 DPI preset, then tuned the layer down to medium via DpiBlock
      const target = layer({ dpi: 'medium', module: LayerModule.LASER_UNIVERSAL, presetId: 'wood_engraving_high' });

      mockGetAllLayers.mockReturnValue([{ getGroup: () => target }]);
      postMaterialPresetChange();

      expect(mockApplyPreset).toHaveBeenCalledTimes(1);
      expect(target.attrs.dpi).toBe('medium');
    });

    test('falls back to a groupId sibling when the preset has no settings for the machine', () => {
      // wood_engraving_high scopes only to HEXA RF; on fbb2 the base member takes over.
      // Layer dpi 'medium' matches the base's declared dpi → picked by dpi preference.
      const target = layer({ dpi: 'medium', module: LayerModule.LASER_UNIVERSAL, presetId: 'wood_engraving_high' });

      mockGetAllLayers.mockReturnValue([{ getGroup: () => target }]);
      postMaterialPresetChange();

      expect(mockApplyPreset).toHaveBeenCalledTimes(1);
      expect(target.attrs.presetId).toBe('wood_engraving');
      expect(target.attrs.configName).toBe('wood_engraving');
      expect(target.attrs.materialId).toBe('wood');
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

  describe('stageMaterialPreset', () => {
    test('stages refs + values in the config store with forced defaults and clamped speed', () => {
      const material = { category: 'wood', id: 'wood', presets: [] } as never;
      const preset = {
        id: 'p1',
        legacyKey: 'wood_3mm_cutting',
        origin: 'default',
        settings: {},
      } as never;

      stageMaterialPreset(material, preset, { dpi: 'high', power: 60, speed: 100000 }, LayerModule.LASER_UNIVERSAL);

      const state = useConfigPanelStore.getState();

      expect(state.configName.value).toBe('wood_3mm_cutting');
      expect(state.materialId.value).toBe('wood');
      expect(state.presetId.value).toBe('p1');
      expect(state.dpi.value).toBe('high');
      expect(state.power.value).toBe(60);
      // Forced key absent from the preset falls back to the default; speed is clamped to the workarea
      expect(state.repeat.value).toBe(1);
      expect(state.speed.value).toBeLessThan(100000);
      // Non-forced key absent from the preset is left alone
      expect(useMaterialStore.getState().recents[0]).toMatchObject({ materialId: 'wood', presetId: 'p1' });
    });
  });

  describe('initMaterialBrowser', () => {
    test('migrates the store only while the gate is on', () => {
      resetMaterialStoreInit();
      useMaterialStore.setState({ migratedFromPresets: false });
      mockIsActive.mockReturnValue(false);
      initMaterialBrowser();
      expect(useMaterialStore.getState().migratedFromPresets).toBe(false);

      mockIsActive.mockReturnValue(true);
      initMaterialBrowser();
      expect(useMaterialStore.getState().migratedFromPresets).toBe(true);
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
