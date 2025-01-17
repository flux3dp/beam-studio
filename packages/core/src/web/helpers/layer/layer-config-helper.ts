import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import history from 'app/svgedit/history/history';
import LayerModule, { modelsWithModules } from 'app/constants/layer-module/layer-modules';
import layerModuleHelper from 'helpers/layer-module/layer-module-helper';
import presetHelper from 'helpers/presets/preset-helper';
import toggleFullColorLayer from 'helpers/layer/full-color/toggleFullColorLayer';
import updateLayerColorFilter from 'helpers/color/updateLayerColorFilter';
import { ConfigKey, ConfigKeyTypeMap, ILayerConfig, Preset } from 'interfaces/ILayerConfig';
import { getAllLayerNames, getLayerByName } from 'helpers/layer/layer-helper';
import { getPromarkInfo } from 'helpers/device/promark/promark-info';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import { IBatchCommand } from 'interfaces/IHistory';
import { LaserType } from 'app/constants/promark-constants';
import { promarkModels } from 'app/actions/beambox/constant';

const getLayerElementByName = (layerName: string) => {
  const allLayers = Array.from(document.querySelectorAll('g.layer'));
  const layer = allLayers.find((l) => {
    const title = l.querySelector('title');
    if (title) {
      return title.textContent === layerName;
    }
    return false;
  });
  return layer;
};

const attributeMap: { [key in ConfigKey]: string } = {
  speed: 'data-speed',
  printingSpeed: 'data-printingSpeed',
  power: 'data-strength',
  minPower: 'data-minPower',
  ink: 'data-ink',
  repeat: 'data-repeat',
  height: 'data-height',
  zStep: 'data-zstep',
  diode: 'data-diode',
  configName: 'data-configName',
  module: 'data-module',
  backlash: 'data-backlash',
  multipass: 'data-multipass',
  uv: 'data-uv',
  halftone: 'data-halftone',
  wInk: 'data-wInk',
  wSpeed: 'data-wSpeed',
  wMultipass: 'data-wMultipass',
  wRepeat: 'data-wRepeat',
  color: 'data-color',
  fullcolor: 'data-fullcolor',
  split: 'data-split',
  cRatio: 'data-cRatio',
  mRatio: 'data-mRatio',
  yRatio: 'data-yRatio',
  kRatio: 'data-kRatio',
  printingStrength: 'data-printingStrength',
  clipRect: 'data-clipRect',
  ref: 'data-ref',
  focus: 'data-focus',
  focusStep: 'data-focusStep',
  fillInterval: 'data-fillInterval',
  frequency: 'data-frequency',
  pulseWidth: 'data-pulseWidth',
  fillAngle: 'data-fillAngle',
  biDirectional: 'data-biDirectional',
  crossHatch: 'data-crossHatch',
  dottingTime: 'data-dottingTime',
};

export const CUSTOM_PRESET_CONSTANT = ' ';

export const baseConfig: Partial<ConfigKeyTypeMap> = {
  speed: 20,
  printingSpeed: 60,
  power: 15,
  minPower: 0,
  ink: BeamboxPreference.read('multipass-compensation') !== false ? 3 : 1,
  repeat: 1,
  height: -3,
  // explicit for beamo model
  zStep: 0,
  diode: 0,
  configName: '',
  module: LayerModule.LASER_UNIVERSAL,
  backlash: 0,
  multipass: 3,
  uv: 0,
  // 1 for fm, 2 for am
  halftone: 1,
  // parameters for white ink
  wSpeed: 100,
  wInk: BeamboxPreference.read('multipass-compensation') !== false ? -12 : -4,
  wMultipass: 3,
  wRepeat: 1,
  // parameters for split color
  cRatio: 100,
  mRatio: 100,
  yRatio: 100,
  kRatio: 100,
  // parameters single color printing image processing
  printingStrength: 100,
  // lower focus parameters
  focus: -2,
  focusStep: -2,
  // promark parameters
  fillInterval: 0.01,
  fillAngle: 0,
  biDirectional: true,
  frequency: 27,
  pulseWidth: 500,
  dottingTime: 100,
};

/**
 * @returns Default config based on Promark laser type and watt
 */
export const getDefaultConfig = (): Partial<ConfigKeyTypeMap> => {
  const workarea = BeamboxPreference.read('workarea');
  const config = { ...baseConfig };
  const isPromark = promarkModels.has(workarea);
  if (isPromark) {
    config.speed = 1000;
    const promarkInfo = getPromarkInfo();
    if (promarkInfo.laserType === LaserType.MOPA) {
      if (promarkInfo.watt >= 100) config.frequency = 55;
      else if (promarkInfo.watt >= 60) config.frequency = 40;
      else config.frequency = 25;
    } else if (promarkInfo.watt >= 50) config.frequency = 45;
    else if (promarkInfo.watt >= 30) config.frequency = 30;
    else config.frequency = 27;
  }
  return config;
};

export const booleanConfig: ConfigKey[] = [
  'fullcolor',
  'ref',
  'split',
  'biDirectional',
  'crossHatch',
];

/**
 * getData from layer element
 * @param layer layer Element
 * @param key data key
 * @param applyPrinting if true, return printingSpeed if module is printer and type is speed
 * @returns data value in type T
 */
export const getData = <T extends ConfigKey>(
  layer: Element,
  key: T,
  applyPrinting = false
): ConfigKeyTypeMap[T] => {
  let attr = attributeMap[key];
  if (!attr || !layer) return undefined;
  const defaultConfig = getDefaultConfig();
  if (
    key === 'speed' &&
    applyPrinting &&
    layer.getAttribute(attributeMap.module) === String(LayerModule.PRINTER)
  ) {
    // eslint-disable-next-line no-param-reassign
    key = 'printingSpeed' as T;
    attr = attributeMap.printingSpeed;
  }
  if (['configName', 'color', 'clipRect'].includes(key)) {
    return (layer.getAttribute(attr) || defaultConfig[key]) as ConfigKeyTypeMap[T];
  }
  if (booleanConfig.includes(key)) return (layer.getAttribute(attr) === '1') as ConfigKeyTypeMap[T];
  if (key === 'module')
    return Number(layer.getAttribute(attr) || LayerModule.LASER_UNIVERSAL) as ConfigKeyTypeMap[T];
  return Number(layer.getAttribute(attr) || defaultConfig[key]) as ConfigKeyTypeMap[T];
};

export const writeDataLayer = <T extends ConfigKey>(
  layer: Element,
  key: T,
  value: ConfigKeyTypeMap[T] | undefined,
  opts?: { applyPrinting?: boolean; batchCmd?: IBatchCommand }
): void => {
  if (!layer) return;
  let attr = attributeMap[key];
  if (!attr) return;
  if (
    key === 'speed' &&
    opts?.applyPrinting &&
    layer.getAttribute(attributeMap.module) === String(LayerModule.PRINTER)
  )
    attr = attributeMap.printingSpeed;
  const originalValue = layer.getAttribute(attr);
  if (booleanConfig.includes(key))
    // eslint-disable-next-line no-param-reassign
    value = (value ? '1' : undefined) as ConfigKeyTypeMap[T];
  if (value === undefined) layer.removeAttribute(attr);
  else layer.setAttribute(attr, String(value));
  if (opts?.batchCmd) {
    const cmd = new history.ChangeElementCommand(layer, { [attr]: originalValue });
    opts.batchCmd.addSubCommand(cmd);
  }
};

export const writeData = <T extends ConfigKey>(
  layerName: string,
  key: ConfigKey,
  value: ConfigKeyTypeMap[T] | undefined,
  opts?: { applyPrinting?: boolean; batchCmd?: IBatchCommand }
): void => {
  const layer = getLayerElementByName(layerName);
  if (!layer) return;
  writeDataLayer(layer, key, value, opts);
};

export const getMultiSelectData = <T extends ConfigKey>(
  layers: Element[],
  currentLayerIdx: number,
  key: T
): { value: ConfigKeyTypeMap[T]; hasMultiValue: boolean } => {
  const mainIndex = currentLayerIdx > -1 ? currentLayerIdx : 0;
  const mainLayer = layers[mainIndex] || layers.find((l) => !!l);
  if (!mainLayer) return { value: undefined, hasMultiValue: false };
  let value = getData(mainLayer, key, true);
  let hasMultiValue = false;
  for (let i = 0; i < layers.length; i += 1) {
    // eslint-disable-next-line no-continue
    if (i === currentLayerIdx) continue;
    const layer = layers[i];
    if (layer) {
      const layerValue = getData(layer, key, true);
      if (value !== layerValue) {
        hasMultiValue = true;
        if (key === 'height') {
          // Always use the max value
          value = Math.max(value as number, layerValue as number) as ConfigKeyTypeMap[T];
          if ((value as number) > 0) break;
        } else if (key === 'diode') {
          // Always use on if there is any on
          value = 1 as ConfigKeyTypeMap[T];
          break;
        } else if (booleanConfig.includes(key)) {
          // Always use true if there is any true
          value = true as ConfigKeyTypeMap[T];
          break;
        } else break;
      }
    }
  }
  return { value, hasMultiValue };
};

export const initLayerConfig = (layerName: string): void => {
  const workarea = BeamboxPreference.read('workarea');
  const defaultConfig = getDefaultConfig();
  const keys = Object.keys(defaultConfig) as ConfigKey[];
  const layer = getLayerElementByName(layerName);
  const defaultLaserModule = layerModuleHelper.getDefaultLaserModule();
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (defaultConfig[key] !== undefined) {
      if (key === 'module' && modelsWithModules.has(workarea)) {
        writeDataLayer(layer, key, defaultLaserModule);
      } else writeDataLayer(layer, key, defaultConfig[keys[i]] as number | string);
    }
  }
};

export const cloneLayerConfig = (targetLayerName: string, baseLayerName: string): void => {
  const baseLayer = getLayerElementByName(baseLayerName);
  if (!baseLayer) {
    initLayerConfig(targetLayerName);
  } else {
    const keys = Object.keys(attributeMap) as ConfigKey[];
    const targetLayer = getLayerElementByName(targetLayerName);
    if (targetLayer) {
      for (let i = 0; i < keys.length; i += 1) {
        if (booleanConfig.includes(keys[i])) {
          if (getData(baseLayer, keys[i])) writeDataLayer(targetLayer, keys[i], true);
        } else {
          const value = getData(baseLayer, keys[i]);
          if (value) writeDataLayer(targetLayer, keys[i], value as number | string);
        }
      }
      updateLayerColorFilter(targetLayer as SVGGElement);
    }
  }
};

export const getLayerConfig = (layerName: string): ILayerConfig => {
  const layer = getLayerElementByName(layerName);
  if (!layer) {
    return null;
  }

  const data = {};
  const keys = Object.keys(attributeMap) as ConfigKey[];
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    data[key] = { value: getData(layer, key, true) };
  }

  return data as ILayerConfig;
};

export const getLayersConfig = (layerNames: string[], currentLayerName?: string): ILayerConfig => {
  const layers = layerNames.map((layerName) => getLayerElementByName(layerName));
  const currentLayerIdx = layerNames.indexOf(currentLayerName);
  const data = {};
  const keys = Object.keys(attributeMap) as ConfigKey[];
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    data[key] = getMultiSelectData(layers, currentLayerIdx, key);
  }

  return data as ILayerConfig;
};

export const toggleFullColorAfterWorkareaChange = (): void => {
  const workarea = BeamboxPreference.read('workarea') || BeamboxPreference.read('model');
  const layerNames = getAllLayerNames();
  const defaultLaserModule = layerModuleHelper.getDefaultLaserModule();
  for (let i = 0; i < layerNames.length; i += 1) {
    const layerName = layerNames[i];
    const layer = getLayerByName(layerName);
    // eslint-disable-next-line no-continue
    if (!layer) continue;
    if (!modelsWithModules.has(workarea)) {
      writeDataLayer(layer, 'module', LayerModule.LASER_UNIVERSAL);
      toggleFullColorLayer(layer, { val: false });
    } else {
      writeDataLayer(layer, 'module', defaultLaserModule);
    }
  }
};

export const applyDefaultLaserModule = (): void => {
  const workarea = BeamboxPreference.read('workarea');
  if (modelsWithModules.has(workarea)) {
    const layerNames = getAllLayerNames();
    const defaultLaserModule = layerModuleHelper.getDefaultLaserModule();
    for (let i = 0; i < layerNames.length; i += 1) {
      const layerName = layerNames[i];
      const layer = getLayerByName(layerName);
      // eslint-disable-next-line no-continue
      if (!layer) continue;
      if (getData(layer, 'module') === LayerModule.LASER_UNIVERSAL) {
        writeDataLayer(layer, 'module', defaultLaserModule);
      }
    }
  }
};

export const laserConfigKeys: ConfigKey[] = [
  'speed',
  'power',
  'minPower',
  'repeat',
  'height',
  'zStep',
  'focus',
  'focusStep',
];

export const printerConfigKeys: ConfigKey[] = [
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
];

export const promarkConfigKeys: ConfigKey[] = [
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
];

// Forced Keys: If not set, use default value
export const forcedKeys = ['speed', 'power', 'ink', 'multipass', 'halftone', 'repeat'];

export const getConfigKeys = (module: LayerModule): ConfigKey[] => {
  const workarea = BeamboxPreference.read('workarea');
  if (promarkModels.has(workarea)) return promarkConfigKeys;
  if (module === LayerModule.PRINTER) return printerConfigKeys;
  return laserConfigKeys;
};

export const getPromarkLimit = (): {
  pulseWidth?: { min: number; max: number };
  frequency?: { min: number; max: number };
} => {
  const { laserType, watt } = getPromarkInfo();
  if (laserType === LaserType.MOPA) {
    // pulseWidth for M100 V1: 10~500, M20 V1: 2~350
    if (watt >= 100) return { pulseWidth: { min: 2, max: 500 }, frequency: { min: 1, max: 1000 } };
    if (watt >= 60) return { pulseWidth: { min: 2, max: 500 }, frequency: { min: 1, max: 1000 } };
    return { pulseWidth: { min: 2, max: 500 }, frequency: { min: 1, max: 1000 } };
  }
  if (watt >= 50) return { frequency: { min: 45, max: 170 } };
  if (watt >= 30) return { frequency: { min: 30, max: 60 } };
  return { frequency: { min: 27, max: 60 } };
};

export const applyPreset = (
  layer: Element,
  preset: Preset,
  opts: { applyName?: boolean; batchCmd?: IBatchCommand } = {}
): void => {
  const workarea: WorkAreaModel = BeamboxPreference.read('workarea');
  const { maxSpeed, minSpeed } = getWorkarea(workarea);
  const { applyName = true, batchCmd } = opts;
  const { module } = preset;
  const keys = getConfigKeys(module);
  const defaultConfig = getDefaultConfig();
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    let value = preset[key];
    if (value === undefined) {
      if (forcedKeys.includes(key)) value = defaultConfig[key];
      // eslint-disable-next-line no-continue
      else continue;
    }
    if (key === 'speed' || key === 'printingSpeed')
      value = Math.max(minSpeed, Math.min(value as number, maxSpeed));
    writeDataLayer(layer, key, value, {
      applyPrinting: module === LayerModule.PRINTER,
      batchCmd,
    });
  }
  if (applyName)
    writeDataLayer(
      layer,
      'configName',
      (preset.isDefault ? preset.key : preset.name) || CUSTOM_PRESET_CONSTANT
    );
};

/**
 * Update all layer configs values due to preset and custom config value change
 */
export const postPresetChange = (): void => {
  // TODO: add test
  const workarea: WorkAreaModel = BeamboxPreference.read('workarea');
  const { maxSpeed, minSpeed } = getWorkarea(workarea);
  const isPromark = promarkModels.has(workarea);
  const promarkLimit = isPromark ? getPromarkLimit() : null;
  const layerNames = getAllLayerNames();
  const allPresets = presetHelper.getAllPresets();

  for (let i = 0; i < layerNames.length; i += 1) {
    const layerName = layerNames[i];
    const layer = getLayerByName(layerName);
    // eslint-disable-next-line no-continue
    if (!layer) continue;

    const configName = getData(layer, 'configName');
    const preset = allPresets.find(
      (c) => !c.hide && (configName === c.key || configName === c.name)
    );
    if (preset?.isDefault) {
      const layerModule = getData(layer, 'module') as LayerModule;
      const defaultPreset = presetHelper.getDefaultPreset(preset.key, workarea, layerModule);
      if (!defaultPreset) {
        // Config exists but preset not found: no preset for module
        writeDataLayer(layer, 'configName', undefined);
      } else {
        applyPreset(layer, defaultPreset, { applyName: false });
      }
    } else if (preset) {
      applyPreset(layer, preset, { applyName: false });
    } else {
      writeDataLayer(layer, 'configName', undefined);
    }
    const speed = getData(layer, 'speed');
    if (speed > maxSpeed) writeDataLayer(layer, 'speed', maxSpeed);
    if (speed < minSpeed) writeDataLayer(layer, 'speed', minSpeed);
    const printingSpeed = getData(layer, 'printingSpeed');
    if (printingSpeed > maxSpeed) writeDataLayer(layer, 'printingSpeed', maxSpeed);
    if (printingSpeed < minSpeed) writeDataLayer(layer, 'printingSpeed', minSpeed);
    if (isPromark) {
      if (promarkLimit.frequency) {
        const frequency = getData(layer, 'frequency');
        if (frequency < promarkLimit.frequency.min)
          writeDataLayer(layer, 'frequency', promarkLimit.frequency.min);
        else if (frequency > promarkLimit.frequency.max)
          writeDataLayer(layer, 'frequency', promarkLimit.frequency.max);
      }
      if (promarkLimit.pulseWidth) {
        const pulseWidth = getData(layer, 'pulseWidth');
        if (pulseWidth < promarkLimit.pulseWidth.min)
          writeDataLayer(layer, 'pulseWidth', promarkLimit.pulseWidth.min);
        else if (pulseWidth > promarkLimit.pulseWidth.max)
          writeDataLayer(layer, 'pulseWidth', promarkLimit.pulseWidth.max);
      }
    }
  }
};

export default {
  applyPreset,
  CUSTOM_PRESET_CONSTANT,
  initLayerConfig,
  cloneLayerConfig,
  getLayerConfig,
  getLayersConfig,
  writeData,
  getPromarkLimit,
};
