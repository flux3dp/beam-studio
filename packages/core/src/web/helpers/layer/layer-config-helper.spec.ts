/* eslint-disable import/first */
import LayerModule from 'app/constants/layer-module/layer-modules';
import { LaserType } from 'app/constants/promark-constants';

const mockGetDefaultLaserModule = jest.fn();
jest.mock('helpers/layer-module/layer-module-helper', () => ({
  getDefaultLaserModule: () => mockGetDefaultLaserModule(),
}));

const mockRead = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (key: string) => mockRead(key),
}));

const mockGetPromarkInfo = jest.fn();
jest.mock('helpers/device/promark/promark-info', () => ({
  getPromarkInfo: (...args) => mockGetPromarkInfo(...args),
}));

import {
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
jest.mock('helpers/presets/preset-helper', () => ({
  getAllPresets: () => mockGetAllPresets(),
  getDefaultPreset: (name) => mockGetDefaultPreset(name),
}));

const mockGetAllLayerNames = jest.fn();
const mockGetLayerByName = jest.fn();
jest.mock('helpers/layer/layer-helper', () => ({
  getAllLayerNames: () => mockGetAllLayerNames(),
  getLayerByName: (name) => mockGetLayerByName(name),
}));

const mockToggleFullColorLayer = jest.fn();
jest.mock(
  'helpers/layer/full-color/toggleFullColorLayer',
  () =>
    (...args) =>
      mockToggleFullColorLayer(...args)
);

const defaultLaserConfigs = {
  speed: { value: 20 },
  printingSpeed: { value: 60 },
  minPower: { value: 0 },
  power: { value: 15 },
  ink: { value: 3 },
  repeat: { value: 1 },
  height: { value: -3 },
  zStep: { value: 0 },
  diode: { value: 0 },
  configName: { value: '' },
  module: { value: 15 },
  backlash: { value: 0 },
  multipass: { value: 3 },
  uv: { value: 0 },
  wInk: { value: -12 },
  wMultipass: { value: 3 },
  wRepeat: { value: 1 },
  wSpeed: { value: 100 },
  color: { value: '#333333' },
  fullcolor: { value: false },
  split: { value: false },
  halftone: { value: 1 },
  cRatio: { value: 100 },
  mRatio: { value: 100 },
  yRatio: { value: 100 },
  kRatio: { value: 100 },
  printingStrength: { value: 100 },
  ref: { value: false },
  clipRect: { value: undefined },
  focus: { value: -2 },
  focusStep: { value: -2 },
  pulseWidth: { value: 500 },
  frequency: { value: 27 },
  fillInterval: { value: 0.01 },
  fillAngle: { value: 0 },
  biDirectional: { value: false },
  crossHatch: { value: false },
  dottingTime: { value: 100 },
};

// Boolean without initLayerConfig will be false
// Update expected value when initLayerConfig is called
const trueConfigs = {
  biDirectional: { value: true },
};

const defaultMultiValueLaserConfigs = {
  speed: { value: 20, hasMultiValue: false },
  printingSpeed: { value: 60, hasMultiValue: false },
  power: { value: 15, hasMultiValue: false },
  minPower: { value: 0, hasMultiValue: false },
  ink: { value: 3, hasMultiValue: false },
  repeat: { value: 1, hasMultiValue: false },
  height: { value: -3, hasMultiValue: false },
  zStep: { value: 0, hasMultiValue: false },
  diode: { value: 0, hasMultiValue: false },
  configName: { value: '', hasMultiValue: false },
  module: { value: 15, hasMultiValue: false },
  backlash: { value: 0, hasMultiValue: false },
  multipass: { value: 3, hasMultiValue: false },
  uv: { value: 0, hasMultiValue: false },
  wInk: { value: -12, hasMultiValue: false },
  wMultipass: { value: 3, hasMultiValue: false },
  wRepeat: { value: 1, hasMultiValue: false },
  wSpeed: { value: 100, hasMultiValue: false },
  color: { value: '#333333', hasMultiValue: false },
  fullcolor: { value: false, hasMultiValue: false },
  split: { value: false, hasMultiValue: false },
  halftone: { value: 1, hasMultiValue: false },
  cRatio: { value: 100, hasMultiValue: false },
  mRatio: { value: 100, hasMultiValue: false },
  yRatio: { value: 100, hasMultiValue: false },
  kRatio: { value: 100, hasMultiValue: false },
  printingStrength: { value: 100, hasMultiValue: false },
  ref: { value: false, hasMultiValue: false },
  clipRect: { value: undefined, hasMultiValue: false },
  focus: { value: -2, hasMultiValue: false },
  focusStep: { value: -2, hasMultiValue: false },
  pulseWidth: { value: 500, hasMultiValue: false },
  frequency: { value: 27, hasMultiValue: false },
  fillInterval: { value: 0.01, hasMultiValue: false },
  fillAngle: { value: 0, hasMultiValue: false },
  biDirectional: { value: false, hasMultiValue: false },
  crossHatch: { value: false, hasMultiValue: false },
  dottingTime: { value: 100, hasMultiValue: false },
};

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
      if (key === 'workarea') return 'ado1';
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
    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'])).toEqual(
      defaultMultiValueLaserConfigs
    );
    writeData('layer 1', 'speed', 30);
    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'])).toEqual({
      ...defaultMultiValueLaserConfigs,
      speed: { value: 30, hasMultiValue: true },
    });
  });

  test('getLayersConfig with diode and height', () => {
    writeData('layer 1', 'diode', 1);
    writeData('layer 1', 'height', -1);
    writeData('layer 1', 'power', 20);

    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'])).toEqual({
      ...defaultMultiValueLaserConfigs,
      power: { value: 20, hasMultiValue: true },
      height: { value: -1, hasMultiValue: true },
      diode: { value: 1, hasMultiValue: true },
    });
    writeData('layer 1', 'height', 1);
    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'])).toEqual({
      ...defaultMultiValueLaserConfigs,
      power: { value: 20, hasMultiValue: true },
      height: { value: 1, hasMultiValue: true },
      diode: { value: 1, hasMultiValue: true },
    });
    expect(getLayersConfig(['layer 0', 'layer 1', 'layer 2', 'layer 3'], 'layer 2')).toEqual({
      ...defaultMultiValueLaserConfigs,
      power: { value: 15, hasMultiValue: true },
      height: { value: 1, hasMultiValue: true },
      diode: { value: 1, hasMultiValue: true },
    });
  });

  test('getLayerConfig of printing layer', () => {
    writeData('layer 1', 'module', 5);
    expect(getLayerConfig('layer 1')).toEqual({
      ...defaultLaserConfigs,
      speed: { value: 60 },
      module: { value: 5 },
    });
    writeData('layer 1', 'speed', 30, { applyPrinting: true });
    expect(getLayerConfig('layer 1')).toEqual({
      ...defaultLaserConfigs,
      speed: { value: 30 },
      printingSpeed: { value: 30 },
      module: { value: 5 },
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
    ]);
  });

  test('getPromarkLimit', () => {
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.Desktop, watt: 20 });
    expect(getPromarkLimit()).toEqual({
      frequency: { min: 27, max: 60 },
    });
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.MOPA, watt: 60 });
    expect(getPromarkLimit()).toEqual({
      pulseWidth: { min: 2, max: 500 },
      frequency: { min: 1, max: 1000 },
    });
  });
});
