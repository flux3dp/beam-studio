import { pipe } from 'remeda';
import { match } from 'ts-pattern';

import { modelsWithModules, promarkModels } from '@core/app/actions/beambox/constant';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { LaserType } from '@core/app/constants/promark-constants';
import { getSupportedModules, getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import history from '@core/app/svgedit/history/history';
import updateLayerColorFilter from '@core/helpers/color/updateLayerColorFilter';
import { getPromarkInfo } from '@core/helpers/device/promark/promark-info';
import toggleFullColorLayer from '@core/helpers/layer/full-color/toggleFullColorLayer';
import { getAllLayerNames, getLayerByName } from '@core/helpers/layer/layer-helper';
import { getDefaultLaserModule } from '@core/helpers/layer-module/layer-module-helper';
import presetHelper from '@core/helpers/presets/preset-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type { ConfigKey, ConfigKeyTypeMap, ILayerConfig, Preset } from '@core/interfaces/ILayerConfig';

const attributeMap: Record<ConfigKey, string> = {
  airAssist: 'data-airAssist',
  amAngleMap: 'data-amAngleMap',
  amDensity: 'data-amDensity',
  backlash: 'data-backlash',
  biDirectional: 'data-biDirectional',
  ceZSpeedLimit: 'data-ceZSpeedLimit',
  clipRect: 'data-clipRect',
  color: 'data-color',
  colorCurvesMap: 'data-colorCurvesMap',
  configName: 'data-configName',
  cRatio: 'data-cRatio',
  crossHatch: 'data-crossHatch',
  diode: 'data-diode',
  dottingTime: 'data-dottingTime',
  fillAngle: 'data-fillAngle',
  fillInterval: 'data-fillInterval',
  focus: 'data-focus',
  focusStep: 'data-focusStep',
  frequency: 'data-frequency',
  fullcolor: 'data-fullcolor',
  halftone: 'data-halftone',
  height: 'data-height',
  ink: 'data-ink',
  kRatio: 'data-kRatio',
  minPower: 'data-minPower',
  module: 'data-module',
  mRatio: 'data-mRatio',
  multipass: 'data-multipass',
  power: 'data-strength',
  printingSpeed: 'data-printingSpeed',
  printingStrength: 'data-printingStrength',
  pulseWidth: 'data-pulseWidth',
  ref: 'data-ref',
  repeat: 'data-repeat',
  speed: 'data-speed',
  split: 'data-split',
  uv: 'data-uv',
  uvIntervalX: 'data-uvIntervalX',
  uvIntervalY: 'data-uvIntervalY',
  wInk: 'data-wInk',
  wMultipass: 'data-wMultipass',
  wobbleDiameter: 'data-wobbleDiameter',
  wobbleStep: 'data-wobbleStep',
  wRepeat: 'data-wRepeat',
  wSpeed: 'data-wSpeed',
  yRatio: 'data-yRatio',
  zStep: 'data-zstep',
};

export const CUSTOM_PRESET_CONSTANT = ' ';

export const baseConfig: Partial<ConfigKeyTypeMap> = {
  airAssist: 100,
  amDensity: 2,
  backlash: 0,
  biDirectional: true,
  ceZSpeedLimit: 140,
  configName: '',
  cRatio: 100,
  diode: 0,
  dottingTime: 100,
  fillAngle: 0,
  fillInterval: 0.01,
  focus: -2,
  focusStep: -2,
  frequency: 27,
  halftone: 1, // 1 for fm, 2 for am
  height: -3,
  ink: useGlobalPreferenceStore.getState()['multipass-compensation'] ? 3 : 1,
  kRatio: 100,
  minPower: 0,
  module: LayerModule.LASER_UNIVERSAL,
  mRatio: 100,
  multipass: 3,
  power: 15,
  printingSpeed: 60,
  printingStrength: 100,
  pulseWidth: 500,
  repeat: 1,
  speed: 20,
  uv: 0,
  uvIntervalX: 0.8,
  uvIntervalY: 0.6,
  wInk: useGlobalPreferenceStore.getState()['multipass-compensation'] ? -12 : -4,
  wMultipass: 3,
  wobbleDiameter: -0.2,
  wobbleStep: -0.05,
  wRepeat: 1,
  wSpeed: 100,
  yRatio: 100,
  zStep: 0,
};

useGlobalPreferenceStore.subscribe(
  (state) => state['multipass-compensation'],
  (value) => {
    baseConfig.ink = value ? 3 : 1;
    baseConfig.wInk = value ? -12 : -4;
  },
);

export const moduleBaseConfig: Partial<Record<LayerModuleType, Partial<Omit<ConfigKeyTypeMap, 'module'>>>> = {
  [LayerModule.PRINTER]: {
    amDensity: 2,
    halftone: 1,
  },
  [LayerModule.PRINTER_4C]: {
    amDensity: 5,
    halftone: 2,
    ink: 70,
    printingSpeed: 15,
  },
};

export const booleanConfig: ConfigKey[] = ['fullcolor', 'ref', 'split', 'biDirectional', 'crossHatch'] as const;
export const objectConfig: ConfigKey[] = ['amAngleMap', 'colorCurvesMap'] as const;
export const timeRelatedConfigs: Set<ConfigKey> = new Set([
  'speed',
  'repeat',
  // printing
  'printingSpeed',
  'multipass',
  // promark
  'dottingTime',
  'fillInterval',
  'fillAngle',
  'biDirectional',
  'crossHatch',
  'wobbleDiameter',
  'wobbleStep',
  // white ink
  'uvIntervalX',
  'uvIntervalY',
]);
export const presetRelatedConfigs: Set<ConfigKey> = new Set([
  'power',
  'speed',
  'repeat',
  'ink',
  'printingSpeed',
  'multipass',
  'zStep',
  'dottingTime',
  'frequency',
  'pulseWidth',
]);

export const laserConfigKeys: ConfigKey[] = [
  'speed',
  'power',
  'minPower',
  'repeat',
  'height',
  'zStep',
  'focus',
  'focusStep',
] as const;

export const printerConfigKeys: ConfigKey[] = [
  'speed', // this will be used as printingSpeed
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
] as const;

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
  'wobbleStep',
  'wobbleDiameter',
] as const;

// Forced Keys: If not set, use default value
export const forcedKeys = ['speed', 'power', 'ink', 'multipass', 'halftone', 'repeat'] as const;

const getLayerElementByName = (layerName: string) =>
  pipe(
    //
    Array.from(document.querySelectorAll('g.layer')),
    (layers) => layers.find((l) => l?.querySelector('title')?.textContent === layerName),
  );

/**
 * @returns Default config based on Promark laser type and watt
 */
export const getDefaultConfig = (): Partial<ConfigKeyTypeMap> => {
  const workarea = useDocumentStore.getState().workarea;
  const isPromark = promarkModels.has(workarea);
  const config = structuredClone(baseConfig);

  if (isPromark) {
    config.speed = 1000;
    config.frequency = match(getPromarkInfo())
      .when(
        ({ laserType, watt }) => laserType === LaserType.MOPA && watt >= 100,
        () => 55,
      )
      .when(
        ({ laserType, watt }) => laserType === LaserType.MOPA && watt >= 60,
        () => 40,
      )
      .when(
        ({ laserType }) => laserType === LaserType.MOPA,
        () => 25,
      )
      .when(
        ({ watt }) => watt >= 50,
        () => 45,
      )
      .when(
        ({ watt }) => watt >= 30,
        () => 30,
      )
      .otherwise(() => 27);
  }

  return config;
};

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
  applyPrinting = false,
): ConfigKeyTypeMap[T] | undefined => {
  let attr = attributeMap[key];

  if (!attr || !layer) {
    return undefined;
  }

  const defaultConfig = getDefaultConfig();

  if (
    key === 'speed' &&
    applyPrinting &&
    printingModules.has(Number.parseInt(layer.getAttribute(attributeMap.module) ?? '', 10))
  ) {
    key = 'printingSpeed' as T;
    attr = attributeMap.printingSpeed;
  }

  if (['clipRect', 'color', 'configName'].includes(key)) {
    return (layer.getAttribute(attr) || defaultConfig[key]) as ConfigKeyTypeMap[T];
  }

  if (booleanConfig.includes(key)) {
    return (layer.getAttribute(attr) === '1') as ConfigKeyTypeMap[T];
  }

  if (objectConfig.includes(key)) {
    const value = layer.getAttribute(attr);

    if (value) {
      try {
        return JSON.parse(value) as ConfigKeyTypeMap[T];
      } catch (e) {
        console.error(`Failed to parse object config for key "${key}":`, e);
      }
    }

    return defaultConfig[key] as ConfigKeyTypeMap[T];
  }

  if (key === 'module') {
    return Number(layer.getAttribute(attr) || LayerModule.LASER_UNIVERSAL) as ConfigKeyTypeMap[T];
  }

  return Number(layer.getAttribute(attr) || defaultConfig[key]) as ConfigKeyTypeMap[T];
};

export const writeDataLayer = <T extends ConfigKey>(
  layer: Element,
  key: T,
  value: ConfigKeyTypeMap[T] | undefined,
  {
    applyPrinting,
    batchCmd,
    shouldApplyModuleBaseConfig = true,
  }: { applyPrinting?: boolean; batchCmd?: IBatchCommand; shouldApplyModuleBaseConfig?: boolean } = {},
): void => {
  if (!layer) {
    return;
  }

  let attr = attributeMap[key];

  if (!attr) {
    return;
  }

  if (
    key === 'speed' &&
    applyPrinting &&
    printingModules.has(Number.parseInt(layer.getAttribute(attributeMap.module) ?? '', 10))
  ) {
    attr = attributeMap.printingSpeed;
  }

  const originalValue = layer.getAttribute(attr);

  if (booleanConfig.includes(key)) {
    value = (value ? '1' : undefined) as ConfigKeyTypeMap[T];
  }

  if (objectConfig.includes(key)) {
    value = (value ? JSON.stringify(value) : undefined) as ConfigKeyTypeMap[T];
  }

  if (value === undefined) {
    layer.removeAttribute(attr);
  } else {
    layer.setAttribute(attr, String(value));
  }

  if (batchCmd) {
    const cmd = new history.ChangeElementCommand(layer, { [attr]: originalValue });

    batchCmd.addSubCommand(cmd);
  }

  if (key === 'module' && shouldApplyModuleBaseConfig) {
    applyModuleBaseConfig(layer, value as LayerModuleType, { parentCmd: batchCmd });
  }
};

export const writeData = <T extends ConfigKey>(
  layerName: string,
  key: ConfigKey,
  value: ConfigKeyTypeMap[T] | undefined,
  opts?: { applyPrinting?: boolean; batchCmd?: IBatchCommand; shouldApplyModuleBaseConfig?: boolean },
): void => {
  const layer = getLayerElementByName(layerName);

  if (!layer) {
    return;
  }

  writeDataLayer(layer, key, value, opts);
};

export const getMultiSelectData = <T extends ConfigKey>(
  layers: Element[],
  currentLayerIdx: number,
  key: T,
): { hasMultiValue: boolean; value: ConfigKeyTypeMap[T] | undefined } => {
  const mainIndex = currentLayerIdx > -1 ? currentLayerIdx : 0;
  const mainLayer = layers[mainIndex] || layers.find(Boolean);

  if (!mainLayer) {
    return { hasMultiValue: false, value: undefined };
  }

  let value = getData(mainLayer, key, true);
  let hasMultiValue = false;

  for (let i = 0; i < layers.length; i++) {
    if (i === currentLayerIdx) continue;

    const layer = layers[i];

    if (layer) {
      const layerValue = getData(layer, key, true);

      if (value === layerValue) continue;

      hasMultiValue = true;

      if (key === 'height') {
        // Always use the max value
        value = Math.max(value as number, layerValue as number) as ConfigKeyTypeMap[T];

        if ((value as number) > 0) {
          break;
        }
      } else if (key === 'diode') {
        // Always use on if there is any on
        value = 1 as ConfigKeyTypeMap[T];
        break;
      } else if (booleanConfig.includes(key)) {
        // Always use true if there is any true
        value = true as ConfigKeyTypeMap[T];
        break;
      } else if (key === 'module') {
        // Always use the UV module if there is any
        if ([layerValue, value].includes(LayerModule.UV_PRINT as any)) {
          value = LayerModule.UV_PRINT as ConfigKeyTypeMap[T];
        }

        break;
      } else {
        break;
      }
    }
  }

  return { hasMultiValue, value };
};

export const initLayerConfig = (layer: Element): void => {
  if (!layer) {
    console.warn('initLayerConfig: Layer not found');

    return;
  }

  const workarea = useDocumentStore.getState().workarea;
  const supportModules = getSupportedModules(workarea);
  const defaultConfig = getDefaultConfig();
  const keys = Object.keys(defaultConfig) as ConfigKey[];
  const defaultLaserModule = getDefaultLaserModule();

  for (const key of keys) {
    if (defaultConfig[key] !== undefined) {
      if (key === 'module') {
        if (supportModules.includes(defaultLaserModule)) {
          writeDataLayer(layer, key, defaultLaserModule, { shouldApplyModuleBaseConfig: false });
        } else if (supportModules.includes(defaultConfig.module!)) {
          writeDataLayer(layer, key, defaultConfig.module!, { shouldApplyModuleBaseConfig: false });
        } else {
          writeDataLayer(layer, key, supportModules[0], { shouldApplyModuleBaseConfig: false });
        }
      } else {
        writeDataLayer(layer, key, defaultConfig[key] as number | string);
      }
    }
  }
};

export const cloneLayerConfig = (targetLayerName: string, baseLayerName: string): void => {
  const targetLayer = getLayerElementByName(targetLayerName);

  if (!targetLayer) return;

  const baseLayer = getLayerElementByName(baseLayerName);

  if (!baseLayer) {
    initLayerConfig(targetLayer);
  } else {
    const keys = Object.keys(attributeMap) as ConfigKey[];

    for (const key of keys) {
      if (booleanConfig.includes(key)) {
        if (getData(baseLayer, key)) writeDataLayer(targetLayer, key, true, { shouldApplyModuleBaseConfig: false });
      } else {
        const value = getData(baseLayer, key);

        if (value) writeDataLayer(targetLayer, key, value, { shouldApplyModuleBaseConfig: false });
      }
    }
    updateLayerColorFilter(targetLayer as SVGGElement);
  }
};

export const getLayerConfig = (layerName: string): ILayerConfig | null => {
  const layer = getLayerElementByName(layerName);

  if (!layer) return null;

  const data: Partial<ILayerConfig> = {};
  const keys = Object.keys(attributeMap) as ConfigKey[];

  for (const key of keys) {
    // @ts-expect-error type mismatch
    data[key] = { value: getData(layer, key, true) };
  }

  return data as ILayerConfig;
};

export const getLayersConfig = (layerNames: string[], currentLayerName?: string): ILayerConfig => {
  const layers = layerNames.map((layerName) => getLayerElementByName(layerName)).filter(Boolean);
  const currentLayerIdx = currentLayerName ? layerNames.indexOf(currentLayerName) : -1;
  const data = {};
  const keys = Object.keys(attributeMap) as ConfigKey[];

  for (const key of keys) {
    // @ts-expect-error type mismatch
    data[key] = getMultiSelectData(layers, currentLayerIdx, key);
  }

  return data as ILayerConfig;
};

export const toggleFullColorAfterWorkareaChange = (): void => {
  const workarea = useDocumentStore.getState().workarea;
  const supportedModules = getSupportedModules(workarea);
  const layerNames = getAllLayerNames();
  const defaultLaserModule = getDefaultLaserModule();

  for (const layerName of layerNames) {
    const layer = getLayerByName(layerName);

    if (!layer) continue;

    const module = getData(layer, 'module') as LayerModuleType;

    if (!supportedModules.includes(module)) {
      writeDataLayer(layer, 'module', defaultLaserModule);

      if (printingModules.has(module)) toggleFullColorLayer(layer, { val: false });
    }
  }
};

export const applyDefaultLaserModule = (): void => {
  const workarea = useDocumentStore.getState().workarea;

  if (modelsWithModules.has(workarea)) {
    const layerNames = getAllLayerNames();
    const defaultLaserModule = getDefaultLaserModule();

    for (const layerName of layerNames) {
      const layer = getLayerByName(layerName);

      if (!layer) continue;

      if (getData(layer, 'module') === LayerModule.LASER_UNIVERSAL) {
        writeDataLayer(layer, 'module', defaultLaserModule);
      }
    }
  }
};

export const applyModuleBaseConfig = (
  layer: Element,
  module: LayerModuleType,
  { parentCmd }: { parentCmd?: IBatchCommand } = {},
): void => {
  const configs = moduleBaseConfig[module];

  if (!configs) {
    return;
  }

  for (const key of Object.keys(configs) as ConfigKey[]) {
    const value = configs[key as keyof typeof configs];

    writeDataLayer(layer, key, value, { batchCmd: parentCmd });
  }
};

export const getConfigKeys = (module: LayerModuleType): ConfigKey[] => {
  const workarea = useDocumentStore.getState().workarea;

  if (promarkModels.has(workarea)) {
    return promarkConfigKeys;
  }

  if (printingModules.has(module)) {
    return printerConfigKeys;
  }

  return laserConfigKeys;
};

export const getPromarkLimit = (): {
  frequency?: { max: number; min: number };
  pulseWidth?: { max: number; min: number };
} =>
  // pulseWidth for M100 V1: 10~500, M20 V1: 2~350
  match(getPromarkInfo())
    .with({ laserType: LaserType.MOPA }, () => ({
      frequency: { max: 1000, min: 1 },
      pulseWidth: { max: 500, min: 2 },
    }))
    .with({ watt: 50 }, () => ({ frequency: { max: 170, min: 45 } }))
    .with({ watt: 30 }, () => ({ frequency: { max: 60, min: 30 } }))
    .otherwise(() => ({ frequency: { max: 60, min: 27 } }));

export const applyPreset = (
  layer: Element,
  preset: Preset,
  opts: { applyName?: boolean; batchCmd?: IBatchCommand } = {},
): void => {
  const workarea = useDocumentStore.getState().workarea;
  const { maxSpeed, minSpeed } = getWorkarea(workarea);
  const { applyName = true, batchCmd } = opts;
  const { module = LayerModule.LASER_UNIVERSAL } = preset;
  const keys = getConfigKeys(module as LayerModuleType);
  const defaultConfig = getDefaultConfig();

  for (const key of keys) {
    let value = preset[key];

    if (value === undefined) {
      if (!forcedKeys.includes(key)) continue;

      value = defaultConfig[key];
    }

    if (key === 'printingSpeed') continue;

    if (key === 'speed') {
      value = Math.max(minSpeed, Math.min(value as number, maxSpeed));
    }

    writeDataLayer(layer, key, value, { applyPrinting: printingModules.has(module), batchCmd });
  }

  if (applyName) {
    writeDataLayer(layer, 'configName', (preset.isDefault ? preset.key : preset.name) || CUSTOM_PRESET_CONSTANT);
  }
};

/**
 * Update all layer configs values due to preset and custom config value change
 */
export const postPresetChange = (): void => {
  // TODO: add test
  const workarea = useDocumentStore.getState().workarea;
  const { maxSpeed, minSpeed } = getWorkarea(workarea);
  const isPromark = promarkModels.has(workarea);
  const promarkLimit = isPromark ? getPromarkLimit() : null;
  const layerNames = getAllLayerNames();
  const allPresets = presetHelper.getAllPresets();

  for (const layerName of layerNames) {
    const layer = getLayerByName(layerName);

    if (!layer) {
      continue;
    }

    const configName = getData(layer, 'configName');
    const preset = allPresets.find((c) => !c.hide && (configName === c.key || configName === c.name));

    if (preset?.isDefault) {
      const layerModule = getData(layer, 'module') as LayerModuleType;
      const defaultPreset = presetHelper.getDefaultPreset(preset.key!, workarea, layerModule);

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

    const speed = getData(layer, 'speed') as number;

    if (speed > maxSpeed) {
      writeDataLayer(layer, 'speed', maxSpeed);
    }

    if (speed < minSpeed) {
      writeDataLayer(layer, 'speed', minSpeed);
    }

    const printingSpeed = getData(layer, 'printingSpeed') as number;

    if (printingSpeed > maxSpeed) {
      writeDataLayer(layer, 'printingSpeed', maxSpeed);
    }

    if (printingSpeed < minSpeed) {
      writeDataLayer(layer, 'printingSpeed', minSpeed);
    }

    if (isPromark) {
      if (promarkLimit?.frequency) {
        const frequency = getData(layer, 'frequency') as number;

        if (frequency < promarkLimit.frequency.min) {
          writeDataLayer(layer, 'frequency', promarkLimit.frequency.min);
        } else if (frequency > promarkLimit.frequency.max) {
          writeDataLayer(layer, 'frequency', promarkLimit.frequency.max);
        }
      }

      if (promarkLimit?.pulseWidth) {
        const pulseWidth = getData(layer, 'pulseWidth') as number;

        if (pulseWidth < promarkLimit.pulseWidth.min) {
          writeDataLayer(layer, 'pulseWidth', promarkLimit.pulseWidth.min);
        } else if (pulseWidth > promarkLimit.pulseWidth.max) {
          writeDataLayer(layer, 'pulseWidth', promarkLimit.pulseWidth.max);
        }
      }
    }
  }
};
