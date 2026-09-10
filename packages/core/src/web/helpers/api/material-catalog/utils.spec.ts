import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import mockLocale from '@core/helpers/locale-helper';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import type { MaterialPreset } from '@core/interfaces/IMaterial';

import {
  getMaterialDisplayName,
  getMaterialRegion,
  getPresetDisplayName,
  isMaterialVisibleInRegion,
  resolveLocalizedString,
  resolvePresetSettings,
} from './utils';

describe('resolvePresetSettings', () => {
  const settings: MaterialPreset['settings'] = {
    '*': { '*': { power: 1 }, [LayerModule.LASER_UNIVERSAL]: { power: 2 } },
    fbb2: { '*': { power: 3 }, [LayerModule.LASER_UNIVERSAL]: { power: 4 } },
  };

  test('resolution chain order', () => {
    expect(resolvePresetSettings(settings, 'fbb2', LayerModule.LASER_UNIVERSAL)!.power).toBe(4);
    expect(resolvePresetSettings(settings, 'fbb2', LayerModule.LASER_10W_DIODE)!.power).toBe(3);
    expect(resolvePresetSettings({ ...settings, fbb2: undefined }, 'fbb2', LayerModule.LASER_UNIVERSAL)!.power).toBe(2);
    expect(resolvePresetSettings({ ...settings, fbb2: undefined }, 'fbb2', LayerModule.LASER_10W_DIODE)!.power).toBe(1);
  });

  test('no match returns null', () => {
    expect(resolvePresetSettings({ ado1: { '1': { power: 5 } } }, 'fbb2', LayerModule.LASER_UNIVERSAL)).toBeNull();
  });

  test('printing-only preset never resolves for a laser module', () => {
    const printingOnly: MaterialPreset['settings'] = { '*': { [LayerModule.PRINTER]: { ink: 3 } } };

    expect(resolvePresetSettings(printingOnly, 'ado1', LayerModule.LASER_10W_DIODE)).toBeNull();
    expect(resolvePresetSettings(printingOnly, 'ado1', LayerModule.PRINTER)!.ink).toBe(3);
  });

  test('pure-wildcard preset resolves for any module (legacy laser user preset behavior)', () => {
    const wildcard: MaterialPreset['settings'] = { '*': { '*': { power: 9 } } };

    expect(resolvePresetSettings(wildcard, 'ado1', LayerModule.LASER_10W_DIODE)!.power).toBe(9);
    expect(resolvePresetSettings(wildcard, 'fbb2', LayerModule.LASER_UNIVERSAL)!.power).toBe(9);
  });
});

describe('getMaterialRegion', () => {
  beforeEach(() => {
    useGlobalPreferenceStore.setState({ 'material-region-override': 'auto' });
    mockLocale.isEu = false;
    mockLocale.isJp = false;
    mockLocale.isNorthAmerica = false;
    mockLocale.isTwOrHk = false;
  });

  test('auto detection fallback to global', () => {
    expect(getMaterialRegion()).toBe('global');
  });

  test('auto detection per locale flag with precedence', () => {
    mockLocale.isTwOrHk = true;
    expect(getMaterialRegion()).toBe('tw');

    mockLocale.isEu = true;
    expect(getMaterialRegion()).toBe('eu');

    mockLocale.isNorthAmerica = true;
    expect(getMaterialRegion()).toBe('us');
  });

  test('preference override wins', () => {
    mockLocale.isNorthAmerica = true;
    useGlobalPreferenceStore.setState({ 'material-region-override': 'jp' });
    expect(getMaterialRegion()).toBe('jp');
  });
});

describe('isMaterialVisibleInRegion', () => {
  const base = { category: 'wood', id: 'm', presets: [] } as const;

  test('untagged and global materials visible everywhere', () => {
    expect(isMaterialVisibleInRegion({ ...base }, 'jp')).toBe(true);
    expect(isMaterialVisibleInRegion({ ...base, regions: ['global'] }, 'us')).toBe(true);
  });

  test('regional materials gated', () => {
    expect(isMaterialVisibleInRegion({ ...base, regions: ['us'] }, 'us')).toBe(true);
    expect(isMaterialVisibleInRegion({ ...base, regions: ['us'] }, 'tw')).toBe(false);
    expect(isMaterialVisibleInRegion({ ...base, regions: ['tw', 'global'] }, 'us')).toBe(true);
  });
});

describe('localized names', () => {
  test('resolveLocalizedString', () => {
    expect(resolveLocalizedString('plain')).toBe('plain');
    expect(resolveLocalizedString({ default: 'Wood', 'zh-tw': '木板' })).toBe('Wood'); // active lang is en
    expect(resolveLocalizedString(undefined)).toBeUndefined();
  });

  test('resolveLocalizedString reads through the locale lookup keys and never blanks', () => {
    // active lang is 'en' here; per-language alias behaviour is covered in locale-codes.spec.ts
    expect(resolveLocalizedString({ default: 'Wood', en: 'Timber' })).toBe('Timber');
    expect(resolveLocalizedString({ default: 'Wood', ja: '木材' })).toBe('Wood');
  });

  test('getPresetDisplayName falls back to legacy dropdown translation', () => {
    const preset: MaterialPreset = {
      id: 'wood_3mm_cutting',
      legacyKey: 'wood_3mm_cutting',
      origin: 'default',
      settings: {},
    };

    // no nameKey and no name → resolves through legacyKey to the legacy dropdown translation
    expect(getPresetDisplayName(preset)).toBe('Wood - 3mm Cutting');
  });

  test('getPresetDisplayName prefers direct localized name', () => {
    const preset: MaterialPreset = {
      id: 'p1',
      name: { default: 'Deep Cut' },
      origin: 'user',
      settings: {},
    };

    expect(getPresetDisplayName(preset)).toBe('Deep Cut');
  });

  test('getMaterialDisplayName falls back to localized name then id', () => {
    expect(
      getMaterialDisplayName({
        category: 'wood',
        id: 'm1',
        name: { default: 'Walnut' },
        presets: [],
        source: 'user',
      }),
    ).toBe('Walnut');
    expect(getMaterialDisplayName({ category: 'wood', id: 'm2', presets: [], source: 'user' })).toBe('m2');
  });
});
