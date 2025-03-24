import LayerModule from '@core/app/constants/layer-module/layer-modules';
import { LaserType } from '@core/app/constants/promark-constants';

const mockGetDefaultLaserModule = jest.fn();

jest.mock('@core/helpers/layer-module/layer-module-helper', () => ({
  getDefaultLaserModule: () => mockGetDefaultLaserModule(),
}));

const mockRead = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: (key: string) => mockRead(key),
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

const mockGetAllPresets = jest.fn();
const mockGetDefaultPreset = jest.fn();

jest.mock('@core/helpers/presets/preset-helper', () => ({
  getAllPresets: () => mockGetAllPresets(),
  getDefaultPreset: (name) => mockGetDefaultPreset(name),
}));

const mockGetAllLayerNames = jest.fn();
const mockGetLayerByName = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getAllLayerNames: () => mockGetAllLayerNames(),
  getLayerByName: (name) => mockGetLayerByName(name),
}));

const mockToggleFullColorLayer = jest.fn();

jest.mock(
  '@core/helpers/layer/full-color/toggleFullColorLayer',
  () =>
    (...args) =>
      mockToggleFullColorLayer(...args),
);

const defaultLaserConfigs = Object.keys(baseConfig).reduce((acc, key) => {
  acc[key] = { value: baseConfig[key] };

  return acc;
}, {});

booleanConfig.forEach((key) => {
  defaultLaserConfigs[key] = { value: false };
});

Object.assign(defaultLaserConfigs, {
  clipRect: { value: undefined },
  color: { value: '#333333' },
});

// Boolean without initLayerConfig will be false
// Update expected value when initLayerConfig is called
const trueConfigs = {
  biDirectional: { value: true },
};

const defaultMultiValueLaserConfigs = Object.keys(defaultLaserConfigs).reduce((acc, key) => {
  acc[key] = { hasMultiValue: false, value: defaultLaserConfigs[key].value };

  return acc;
}, {});

describe('test layer-config-helper', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <g class="layer"></g>
      <g class="layer" data-color="#333333" ><title>layer 1</title></g>
      <g class="layer" data-color="#333333"><title>layer 2</title></g>
      <g class="layer" data-color="#333333"><title>layer 3</title></g>
    `;
    mockGetDefaultLaserModule.mockReturnValue(1);
  });

  it('should return null layer when layer does not exist', () => {
    expect(getLayerConfig('layer 0')).toBeNull();
  });

  test('initLayerConfig', () => {
    initLayerConfig('layer 1');
    expect(getLayerConfig('layer 1')).toEqual({ ...defaultLaserConfigs, ...trueConfigs });
  });

  test('initLayerConfig with module', () => {
    mockRead.mockImplementation((key) => {
      if (key === 'workarea') {
        return 'ado1';
      }

      return undefined;
    });
    initLayerConfig('layer 1');
    expect(getLayerConfig('layer 1')).toEqual({
      ...defaultLaserConfigs,
      ...trueConfigs,
      module: { value: 1 },
    });
  });

  test('write zstep data', () => {
    writeData('layer 1', 'zStep', 1);
    expect(getLayerConfig('layer 1')).toEqual({
      ...defaultLaserConfigs,
      zStep: { value: 1 },
    });
  });

  test('cloneLayerConfig', () => {
    writeData('layer 1', 'speed', 30);
    cloneLayerConfig('layer 3', 'layer 1');
    expect(getLayerConfig('layer 3')).toEqual({
      ...defaultLaserConfigs,
      speed: { value: 30 },
    });
  });

  test('getLayersConfig', () => {
    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'])).toEqual(defaultMultiValueLaserConfigs);
    writeData('layer 1', 'speed', 30);
    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'])).toEqual({
      ...defaultMultiValueLaserConfigs,
      speed: { hasMultiValue: true, value: 30 },
    });
  });

  test('getLayersConfig with diode and height', () => {
    writeData('layer 1', 'diode', 1);
    writeData('layer 1', 'height', -1);
    writeData('layer 1', 'power', 20);

    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'])).toEqual({
      ...defaultMultiValueLaserConfigs,
      diode: { hasMultiValue: true, value: 1 },
      height: { hasMultiValue: true, value: -1 },
      power: { hasMultiValue: true, value: 20 },
    });
    writeData('layer 1', 'height', 1);
    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'])).toEqual({
      ...defaultMultiValueLaserConfigs,
      diode: { hasMultiValue: true, value: 1 },
      height: { hasMultiValue: true, value: 1 },
      power: { hasMultiValue: true, value: 20 },
    });
    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'], 'layer 2')).toEqual({
      ...defaultMultiValueLaserConfigs,
      diode: { hasMultiValue: true, value: 1 },
      height: { hasMultiValue: true, value: 1 },
      power: { hasMultiValue: true, value: 15 },
    });
  });

  test('getLayerConfig of printing layer', () => {
    writeData('layer 1', 'module', 5);
    expect(getLayerConfig('layer 1')).toEqual({
      ...defaultLaserConfigs,
      module: { value: 5 },
      speed: { value: 60 },
    });
    writeData('layer 1', 'speed', 30, { applyPrinting: true });
    expect(getLayerConfig('layer 1')).toEqual({
      ...defaultLaserConfigs,
      module: { value: 5 },
      printingSpeed: { value: 30 },
      speed: { value: 30 },
    });
  });

  test('toggleFullColorAfterWorkareaChange to workarea without module', () => {
    mockRead.mockReturnValue('fbm1');
    mockGetAllLayerNames.mockReturnValue(['layer 1', 'layer 2', 'layer 3']);

    const mockLayer = {
      getAttribute: jest.fn(),
      setAttribute: jest.fn(),
    };

    mockGetLayerByName.mockReturnValue(mockLayer);
    mockLayer.getAttribute.mockReturnValue('1');
    toggleFullColorAfterWorkareaChange();
    expect(mockToggleFullColorLayer).toBeCalledTimes(3);
    expect(mockLayer.setAttribute).toBeCalledTimes(3);
    expect(mockLayer.setAttribute).toHaveBeenNthCalledWith(1, 'data-module', '15');
    expect(mockLayer.setAttribute).toHaveBeenNthCalledWith(2, 'data-module', '15');
    expect(mockLayer.setAttribute).toHaveBeenNthCalledWith(3, 'data-module', '15');
  });

  test('toggleFullColorAfterWorkareaChange to workarea with module', () => {
    mockRead.mockReturnValue('ado1');
    mockGetAllLayerNames.mockReturnValue(['layer 1', 'layer 2', 'layer 3']);

    const mockLayer = {
      getAttribute: jest.fn(),
      setAttribute: jest.fn(),
    };

    mockGetLayerByName.mockReturnValue(mockLayer);
    mockLayer.getAttribute.mockReturnValue('15');
    toggleFullColorAfterWorkareaChange();
    expect(mockToggleFullColorLayer).toBeCalledTimes(3);
    expect(mockLayer.setAttribute).toBeCalledTimes(3);
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
      'printingSpeed',
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
      'uv',
      'repeat',
    ]);
    mockRead.mockReturnValue('fpm1');
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
      frequency: { max: 1000, min: 1 },
      pulseWidth: { max: 500, min: 2 },
    });
  });
});
