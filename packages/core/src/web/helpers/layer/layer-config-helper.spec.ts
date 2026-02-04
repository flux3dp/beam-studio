import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { LaserType } from '@core/app/constants/promark-constants';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { useDocumentStore } from '@core/app/stores/documentStore';

const mockGetDefaultLaserModule = jest.fn();

jest.mock('@core/helpers/layer-module/layer-module-helper', () => ({
  getDefaultLaserModule: () => mockGetDefaultLaserModule(),
}));

const mockGetPromarkInfo = jest.fn();

jest.mock('@core/helpers/device/promark/promark-info', () => ({
  getPromarkInfo: (...args) => mockGetPromarkInfo(...args),
}));

import {
  baseConfig,
  booleanConfig,
  cloneLayerConfig,
  getConfigKeys,
  getLayerConfig,
  getLayersConfig,
  getPromarkLimit,
  initLayerConfig,
  toggleFullColorAfterWorkareaChange,
  writeData,
} from './layer-config-helper';
import type { ConfigKey } from '@core/interfaces/ILayerConfig';

const mockGetAllPresets = jest.fn();
const mockGetDefaultPreset = jest.fn();

jest.mock('@core/helpers/presets/preset-helper', () => ({
  getAllPresets: () => mockGetAllPresets(),
  getDefaultPreset: (name) => mockGetDefaultPreset(name),
}));

const mockGetAllLayers = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getAllLayers: () => mockGetAllLayers(),
}));

const mockToggleFullColorLayer = jest.fn();

jest.mock(
  '@core/helpers/layer/full-color/toggleFullColorLayer',
  () =>
    (...args) =>
      mockToggleFullColorLayer(...args),
);

const defaultConfigs = Object.keys(baseConfig).reduce((acc, key) => {
  acc[key] = { value: baseConfig[key] };

  return acc;
}, {});

const optionalConfigs: ConfigKey[] = ['amAngleMap', 'colorCurvesMap'] as const;

optionalConfigs.forEach((key) => {
  defaultConfigs[key] = { value: undefined };
});

booleanConfig.forEach((key) => {
  defaultConfigs[key] = { value: false };
});

Object.assign(defaultConfigs, {
  clipRect: { value: undefined },
  color: { value: '#333333' },
});

// Boolean without initLayerConfig will be false
// Update expected value when initLayerConfig is called
const trueConfigs = {
  biDirectional: { value: true },
};

const defaultMultiValueConfigs = Object.keys(defaultConfigs).reduce((acc, key) => {
  acc[key] = { hasMultiValue: false, value: defaultConfigs[key].value };

  return acc;
}, {});

const mockLayer = {
  getAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  setAttribute: jest.fn(),
};

describe('test layer-config-helper', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <g class="layer"></g>
      <g class="layer" data-color="#333333" ><title>layer 1</title></g>
      <g class="layer" data-color="#333333"><title>layer 2</title></g>
      <g class="layer" data-color="#333333"><title>layer 3</title></g>
    `;
    jest.resetAllMocks();
    useDocumentStore.setState({ workarea: 'fbm1' });
    useGlobalPreferenceStore.setState({ engrave_dpi: 'high', 'multipass-compensation': false });
    mockGetAllLayers.mockReturnValue([
      { getGroup: () => mockLayer },
      { getGroup: () => mockLayer },
      { getGroup: () => mockLayer },
    ]);
  });

  it('should return null layer when layer does not exist', () => {
    expect(getLayerConfig('layer 0')).toBeNull();
  });

  test('initLayerConfig', () => {
    const layer1 = document.querySelectorAll('g')[1] as SVGGElement;

    initLayerConfig(layer1);
    expect(getLayerConfig('layer 1')).toEqual({ ...defaultConfigs, ...trueConfigs });
  });

  test('initLayerConfig with module', () => {
    const layer1 = document.querySelectorAll('g')[1] as SVGGElement;

    useDocumentStore.setState({ workarea: 'ado1' });
    initLayerConfig(layer1);
    expect(getLayerConfig('layer 1')).toEqual({
      ...defaultConfigs,
      ...trueConfigs,
      module: { value: 1 },
    });
  });

  test('write zstep data', () => {
    writeData('layer 1', 'zStep', 1);
    expect(getLayerConfig('layer 1')).toEqual({
      ...defaultConfigs,
      zStep: { value: 1 },
    });
  });

  test('cloneLayerConfig', () => {
    writeData('layer 1', 'speed', 30);
    cloneLayerConfig('layer 3', 'layer 1');
    expect(getLayerConfig('layer 3')).toEqual({
      ...defaultConfigs,
      speed: { value: 30 },
    });
  });

  test('getLayersConfig', () => {
    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'])).toEqual(defaultMultiValueConfigs);
    writeData('layer 1', 'speed', 30);
    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'])).toEqual({
      ...defaultMultiValueConfigs,
      speed: { hasMultiValue: true, value: 30 },
    });
  });

  test('getLayersConfig with diode and height', () => {
    writeData('layer 1', 'diode', 1);
    writeData('layer 1', 'height', -1);
    writeData('layer 1', 'power', 20);

    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'])).toEqual({
      ...defaultMultiValueConfigs,
      diode: { hasMultiValue: true, value: 1 },
      height: { hasMultiValue: true, value: -1 },
      power: { hasMultiValue: true, value: 20 },
    });
    writeData('layer 1', 'height', 1);
    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'])).toEqual({
      ...defaultMultiValueConfigs,
      diode: { hasMultiValue: true, value: 1 },
      height: { hasMultiValue: true, value: 1 },
      power: { hasMultiValue: true, value: 20 },
    });
    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'], 'layer 2')).toEqual({
      ...defaultMultiValueConfigs,
      diode: { hasMultiValue: true, value: 1 },
      height: { hasMultiValue: true, value: 1 },
      power: { hasMultiValue: true, value: 15 },
    });
  });

  test('getLayerConfig of printing layer', () => {
    writeData('layer 1', 'module', 5);
    expect(getLayerConfig('layer 1')).toEqual({
      ...defaultConfigs,
      module: { value: 5 },
      speed: { value: 60 },
    });
    writeData('layer 1', 'speed', 30, { applyPrinting: true });
    expect(getLayerConfig('layer 1')).toEqual({
      ...defaultConfigs,
      module: { value: 5 },
      printingSpeed: { value: 30 },
      speed: { value: 30 },
    });
  });

  test('toggleFullColorAfterWorkareaChange to workarea without module', () => {
    mockGetAllLayers.mockReturnValue([
      { getGroup: () => mockLayer },
      { getGroup: () => mockLayer },
      { getGroup: () => mockLayer },
    ]);

    mockLayer.getAttribute.mockReturnValue('5');
    mockGetDefaultLaserModule.mockReturnValue(15);
    toggleFullColorAfterWorkareaChange();
    expect(mockToggleFullColorLayer).toHaveBeenCalledTimes(3);
    expect(mockLayer.setAttribute).toHaveBeenCalledTimes(3);
    expect(mockLayer.setAttribute).toHaveBeenNthCalledWith(1, 'data-module', '15');
    expect(mockLayer.setAttribute).toHaveBeenNthCalledWith(2, 'data-module', '15');
    expect(mockLayer.setAttribute).toHaveBeenNthCalledWith(3, 'data-module', '15');
  });

  test('toggleFullColorAfterWorkareaChange to workarea with module', () => {
    useDocumentStore.setState({ workarea: 'ado1' });
    mockGetAllLayers.mockReturnValue([
      { getGroup: () => mockLayer },
      { getGroup: () => mockLayer },
      { getGroup: () => mockLayer },
    ]);

    mockLayer.getAttribute.mockReturnValue('15');
    mockGetDefaultLaserModule.mockReturnValue(1);
    toggleFullColorAfterWorkareaChange();
    expect(mockToggleFullColorLayer).not.toHaveBeenCalled();
    expect(mockLayer.setAttribute).toHaveBeenCalledTimes(3);
    expect(mockLayer.setAttribute).toHaveBeenNthCalledWith(1, 'data-module', '1');
    expect(mockLayer.setAttribute).toHaveBeenNthCalledWith(2, 'data-module', '1');
    expect(mockLayer.setAttribute).toHaveBeenNthCalledWith(3, 'data-module', '1');
  });

  test('getConfigKeys', () => {
    expect(getConfigKeys(LayerModule.LASER_UNIVERSAL)).toEqual([
      'speed',
      'power',
      'minPower',
      'repeat',
      'height',
      'zStep',
      'focus',
      'focusStep',
    ]);
    expect(getConfigKeys(LayerModule.PRINTER)).toEqual([
      'speed',
      'ink',
      'multipass',
      'cRatio',
      'mRatio',
      'yRatio',
      'kRatio',
      'printingStrength',
      'halftone',
      'wInk',
      'wSpeed',
      'wMultipass',
      'wRepeat',
      'repeat',
    ]);
    useDocumentStore.setState({ workarea: 'fpm1' });
    expect(getConfigKeys(LayerModule.PRINTER)).toEqual([
      'speed',
      'power',
      'repeat',
      'pulseWidth',
      'frequency',
      'fillInterval',
      'fillAngle',
      'biDirectional',
      'crossHatch',
      'focus',
      'focusStep',
      'dottingTime',
      'wobbleStep',
      'wobbleDiameter',
    ]);
  });

  test('getPromarkLimit', () => {
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.Desktop, watt: 20 });
    expect(getPromarkLimit()).toEqual({
      frequency: { max: 60, min: 27 },
    });
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.MOPA, watt: 60 });
    expect(getPromarkLimit()).toEqual({
      frequency: { max: 3000, min: 1 },
      pulseWidth: { max: 500, min: 2 },
    });
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.MOPA, watt: 100 });
    expect(getPromarkLimit()).toEqual({
      frequency: { max: 4000, min: 1 },
      pulseWidth: { max: 500, min: 2 },
    });
  });

  test('baseConfig when multipass-compensation changed', () => {
    jest.resetModules();

    const { baseConfig } = require('./layer-config-helper');
    const { mockSubscribe } = require('__mocks__/@core/app/stores/globalPreferenceStore');

    expect(mockSubscribe).toHaveBeenCalledTimes(2);

    const selector = mockSubscribe.mock.calls[0][0];
    const handler = mockSubscribe.mock.calls[0][1];

    handler(selector({ 'multipass-compensation': true }));
    expect(baseConfig.ink).toEqual(3);
    expect(baseConfig.wInk).toEqual(-12);

    handler(selector({ 'multipass-compensation': false }));
    expect(baseConfig.ink).toEqual(1);
    expect(baseConfig.wInk).toEqual(-4);
  });
});
