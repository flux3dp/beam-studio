import { match } from 'ts-pattern';

import { promarkModels } from '@core/app/actions/beambox/constant';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { laserModules, LayerModule, printingModules, UVModules } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useCurveEngravingStore } from '@core/app/stores/curveEngravingStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { getStorage, setStorage } from '@core/app/stores/storageStore';
import i18n from '@core/helpers/i18n';
import { isParamsLabelDev } from '@core/helpers/is-dev';
import { attributeMap, getConfigKeys, getData, objectConfig } from '@core/helpers/layer/layer-config-helper';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { HistoryActionOptions, IBatchCommand } from '@core/interfaces/IHistory';
import type { ConfigKey } from '@core/interfaces/ILayerConfig';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import changeAttribute from '../history/changeAttribute';
import history from '../history/history';
import undoManager from '../history/undoManager';
import { handleHistoryActionOptions } from '../history/utils/handleHistoryActionOptions';
import selectionManager from '../selection';
import selector from '../selector';
import { getBBox } from '../utils/getBBox';

import createNewText from './createNewText';
import { getColumnCount } from './textedit/getters';
import { renderText } from './textedit/renderText';
import { textContentEvents } from './textedit/setters';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const labelKeysAttr = 'data-params-label-keys';
const messageKey = 'params-label-updated';

/** Not a layer config key, rendered as the title line of the label */
export const layerNameKey = 'layerName';

const hiddenKeys = ['clipRect', 'color', 'printingSpeed'] as const satisfies ReadonlyArray<ConfigKey>;

const hiddenKeySet: Set<ConfigKey> = new Set(hiddenKeys);

export type ParamsLabelConfigKey = Exclude<ConfigKey, (typeof hiddenKeys)[number]>;

export type ParamsLabelKey = ParamsLabelConfigKey | typeof layerNameKey;

export const allConfigKeys: ParamsLabelKey[] = [
  layerNameKey,
  ...(Object.keys(attributeMap) as ConfigKey[])
    .filter((key): key is ParamsLabelConfigKey => !hiddenKeySet.has(key))
    .sort(),
];

/** Storage may hold anything, e.g. a leftover value that failed to parse back into an array */
export const toParamsLabelKeys = (stored: unknown): null | ParamsLabelKey[] =>
  Array.isArray(stored) ? (stored as ParamsLabelKey[]) : null;

/**
 * Config keys saved as the default for params labels, null when unset or unusable.
 */
export const getStorageParamsLabelKeys = (): null | ParamsLabelKey[] =>
  toParamsLabelKeys(getStorage('default-params-label-keys'));

export const setStorageParamsLabelKeys = (keys: ParamsLabelKey[]): void => {
  setStorage('default-params-label-keys', keys);
};

/**
 * Keys to display on a params label, falls back to the saved default and then to all
 * keys when the label has no keys of its own.
 */
export const getLabelKeys = (elem: SVGTextElement): ParamsLabelKey[] => {
  const attr = elem.getAttribute(labelKeysAttr);

  if (attr === null) return getStorageParamsLabelKeys() ?? [...allConfigKeys];

  const selected = new Set(attr.split(','));

  return allConfigKeys.filter((key) => selected.has(key));
};

/** Units shown after config values, an empty string for values without one. Always metric, en only. */
export const configUnitMap: Record<ParamsLabelKey, string> = {
  accX: 'mm/s²',
  accY: 'mm/s²',
  airAssist: '%',
  amAngleMap: '',
  amDensity: '',
  backlash: 'mm',
  biDirectional: '',
  blendKWithCmy: '',
  ceZHighSpeed: '',
  colorCurvesMap: '',
  configName: '',
  cRatio: '%',
  crossHatch: '',
  diode: '',
  dottingTime: 'us',
  dpi: '',
  fillAngle: 'deg',
  fillInterval: 'mm',
  focus: 'mm',
  focusStep: 'mm',
  frequency: 'kHz',
  fullcolor: '',
  halftone: '',
  height: 'mm',
  highQuality: '',
  ink: '',
  interpolation: '',
  kRatio: '%',
  [layerNameKey]: '',
  minPadding: 'mm',
  minPower: '%',
  module: '',
  mRatio: '%',
  multipass: 'times',
  nozzleMode: '',
  nozzleOffsetX: 'mm',
  nozzleOffsetY: 'mm',
  oneWayEngraving: '',
  oneWayEngravingReverse: '',
  power: '%',
  printingBotPadding: 'px',
  printingStrength: '%',
  printingTopPadding: 'px',
  pulseWidth: 'ns',
  ref: '',
  refreshInterval: 'sec',
  refreshThreshold: '',
  repeat: 'times',
  rightPadding: 'mm',
  scA0: 'mm/s²',
  scAMax: 'mm/s²',
  scEnable: '',
  scJerk: 'mm/s³',
  speed: 'mm/s',
  split: '',
  texture: '',
  textureMode: '',
  textureRandomIntensity: '%',
  textureStripeAngle: 'deg',
  textureStripeIntensity: '%',
  textureStripeInterval: 'mm',
  travelSpeed: 'mm/s',
  uvCuringAfter: '',
  uvCuringRepeat: 'times',
  uvPrintingRepeat: 'times',
  uvStrength: '%',
  uvXStep: '',
  wInk: '',
  wMultipass: 'times',
  wobbleDiameter: 'mm',
  wobbleStep: 'mm',
  wRepeat: 'times',
  wSpeed: 'mm/s',
  yRatio: '%',
  zStep: 'mm',
};

const textureKeys: ConfigKey[] = [
  'texture',
  'textureMode',
  'textureRandomIntensity',
  'textureStripeAngle',
  'textureStripeIntensity',
  'textureStripeInterval',
];

/**
 * Keys of the blocks AdvancedBlock renders, it is skipped entirely on Promark: those settings live
 * in AdvancedSettingModal and its keys are already part of promarkConfigKeys.
 */
const getAdvancedBlockKeys = (module: LayerModuleType, workarea: WorkAreaModel): ConfigKey[] => {
  if (promarkModels.has(workarea)) return [];

  if (printingModules.has(module)) {
    return module === LayerModule.PRINTER_4C ? ['fullcolor', 'amDensity', 'refreshInterval'] : ['fullcolor'];
  }

  const keys: ConfigKey[] = [];

  // TextureBlock, focus / height keys are already part of laserConfigKeys
  if (workarea !== 'fuv1') keys.push(...textureKeys);

  if (getAddOnInfo(workarea).hybridLaser && useDocumentStore.getState()['enable-diode']) keys.push('diode');

  if (useCurveEngravingStore.getState().hasData && getWorkarea(workarea).curveSpeedLimit?.zRegular) {
    keys.push('ceZHighSpeed');
  }

  return keys;
};

/**
 * Config keys worth showing for the layer the label sits on
 */
export const getRecommendedConfigKeys = (elem: SVGTextElement): ParamsLabelKey[] => {
  const workarea = useDocumentStore.getState().workarea;
  const module = getData(getObjectLayer(elem)?.elem, 'module') ?? LayerModule.LASER_UNIVERSAL;
  const keys: Array<ConfigKey | typeof layerNameKey> = [layerNameKey, ...getConfigKeys(module)];

  keys.push(
    ...match<WorkAreaModel, ConfigKey[]>(workarea)
      .with('fhx2rf', () => ['highQuality'])
      .with('fuv1', () => ['rightPadding', 'uvStrength', 'uvCuringAfter', 'uvCuringRepeat', 'uvPrintingRepeat'])
      .otherwise(() => []),
  );

  keys.push(
    ...match<LayerModuleType, ConfigKey[]>(module)
      .when(
        (m) => laserModules.has(m),
        () => (getAddOnInfo(workarea).airAssist ? (['dpi', 'airAssist'] as ConfigKey[]) : ['dpi']),
      )
      .when(
        (m) => UVModules.has(m),
        () => ['halftone', 'ink', 'multipass', 'interpolation', 'uvXStep'],
      )
      .otherwise(() => []),
  );

  keys.push(...getAdvancedBlockKeys(module, workarea));

  // UV modules are not printing modules, so getConfigKeys falls back to the laser keys, but
  // ConfigPanel renders PowerBlock for laser modules only
  const excluded = new Set<string>(UVModules.has(module) ? ['power', 'minPower'] : []);

  return allConfigKeys.filter((key) => keys.includes(key) && !excluded.has(key));
};

/** Rows of a full line value, empty when the layer has no value for it */
const getFullLineRows = (layer: SVGGElement, key: ParamsLabelKey): string[] =>
  match(key)
    .with('colorCurvesMap', (k) => {
      const value = getData(layer, k);

      return value
        ? [`${k}:`, ...(['c', 'm', 'y', 'k'] as const).map((color) => `  ${color}: ${JSON.stringify(value[color])}`)]
        : [];
    })
    .otherwise((k) => {
      const value = getData(layer, key as ConfigKey);

      return value ? [`${k}: ${JSON.stringify(value)}`] : [];
    });

/**
 * Cells of the label, laid out row major over columnCount columns by renderText. A cell followed by
 * empty cells for the rest of its row spans the whole row, which is how the title and the full line
 * values are rendered.
 */
const getParamsLabelLines = (keys: ParamsLabelKey[], columnCount: number, layer?: SVGGElement, title?: string) => {
  if (!layer) return [i18n.lang.params_label.placeholder];

  // Cells that pad a spanning row out to the end of its row
  const padding = Array<string>(columnCount - 1).fill('');
  const spanningRows: string[] = keys.includes(layerNameKey) && title ? [title] : [];
  const cells: string[] = [];

  keys.forEach((key) => {
    if (key === layerNameKey) return;

    if (objectConfig.includes(key)) {
      spanningRows.push(...getFullLineRows(layer, key));

      return;
    }

    const value = getData(layer, key, true);

    if (value === undefined) return;

    const unit = configUnitMap[key];

    // Add trailing whitespace to provide natural spacing between columns.
    cells.push(`${key}: ${value}${unit ? ` ${unit}` : ''}  `);
  });

  // Layer name first, then Full line values, then normal cell data
  return spanningRows.flatMap((text) => [text].concat(padding)).concat(cells);
};

/** Text currently displayed by the label, joined the way renderText takes it */
const getLabelValue = (elem: SVGTextElement): string =>
  (Array.from(elem.childNodes) as Element[])
    .filter((child) => child.tagName === 'tspan')
    .map((tspan) => tspan.textContent ?? '')
    .join('\u0085');

interface Size {
  height: number;
  width: number;
}

/**
 * Stretch the label back to the size it had before the render. setSvgElemSize works on the
 * selected element, so the selection is restored afterwards: this also runs on undo / redo and
 * before a task is sent.
 */
const applySize = (elem: SVGTextElement, { height, width }: Size): void => {
  const selected = selectionManager.getSelectedElements();

  selectionManager.selectOnly([elem]);
  svgCanvas.setSvgElemSize('width', width, false);
  svgCanvas.setSvgElemSize('height', height, false);

  if (selected.length && !(selected.length === 1 && selected[0] === elem)) {
    selectionManager.selectOnly(selected, true);
  }
};

export interface RenderParamsLabelOptions extends HistoryActionOptions {
  /** Show the "params label updated" message. Uses one message key, so a batch shows one message. */
  showMessage?: boolean;
}

/**
 * Re-render the label from the params of the layer it sits on, keeping its current size.
 * @returns the batch command holding the change, null when nothing changed
 */
export const renderParamsLabel = (
  elem: SVGTextElement,
  { showMessage = true, ...historyOptions }: RenderParamsLabelOptions = {},
): IBatchCommand | null => {
  if (!isParamsLabelDev()) return null;

  const layer = getObjectLayer(elem);
  const columnCount = getColumnCount(elem) ?? 1;
  const newValue = getParamsLabelLines(getLabelKeys(elem), columnCount, layer?.elem, layer?.title).join('\u0085');
  const oldValue = getLabelValue(elem);
  const oldAttributes = {
    'font-size': elem.getAttribute('font-size'),
    transform: elem.getAttribute('transform'),
    x: elem.getAttribute('x'),
    y: elem.getAttribute('y'),
  };
  // A label with nothing rendered yet, so one that was just created, is laid out at the size its
  // content needs. Every later render keeps the size the user gave it.
  const size = elem.querySelector('tspan') ? getBBox(elem) : null;

  renderText(elem, newValue);

  if (size) applySize(elem, size);

  const batchCmd = new history.BatchCommand('Update Params Label');
  const attributeCmd = new history.ChangeElementCommand(elem, oldAttributes, 'params label size');

  if (Object.keys(attributeCmd.oldValues).length) batchCmd.addSubCommand(attributeCmd);

  if (oldValue !== newValue) batchCmd.addSubCommand(new history.ChangeTextCommand(elem, oldValue, newValue));

  selector.getSelectorManager().resizeSelectors([elem]);
  textContentEvents.emit('changed');

  if (showMessage) {
    MessageCaller.openMessage({
      content: i18n.lang.params_label.updated,
      duration: 2,
      key: messageKey,
      level: MessageLevel.SUCCESS,
    });
  }

  // Nothing to record when the label already showed the current params
  if (batchCmd.isEmpty()) return null;

  // The layout depends on both the text and the attributes, and undo restores them in separate
  // sub commands, so lay the label out again once the whole batch has been applied.
  batchCmd.onAfter = () => {
    renderText(elem);
    selector.getSelectorManager().resizeSelectors([elem]);
    textContentEvents.emit('changed');
  };

  handleHistoryActionOptions(batchCmd, historyOptions);

  return batchCmd;
};

/** Re-render every params label on the canvas, e.g. before a task is sent to the machine. */
export const renderAllParamsLabels = (historyOptions: HistoryActionOptions = {}): void => {
  const paramsLabels = Array.from(document.querySelectorAll('text[data-params-label="true"]')) as SVGTextElement[];

  paramsLabels.forEach((elem) => renderParamsLabel(elem, historyOptions));
};

/**
 * Set the displayed config keys and record it in undo history. The text content is derived from
 * the keys, so the render that follows goes into the same batch.
 */
export const writeLabelKeys = (elem: SVGTextElement, keys: ParamsLabelKey[]): void => {
  const batchCmd = new history.BatchCommand('Change Params Label Keys');

  // 'none' instead of '' because history commands treat an empty attribute as a removed one,
  // and a missing attribute means every key is selected
  const cmd = changeAttribute(elem, { [labelKeysAttr]: keys.length ? keys.join(',') : 'none' });

  handleHistoryActionOptions(cmd, { parentCmd: batchCmd });

  renderParamsLabel(elem, { parentCmd: batchCmd });
  handleHistoryActionOptions(batchCmd);
};

/** Create a params label already showing the params of the layer it lands on. */
export const createParamsLabel = (x: number, y: number): SVGTextElement => {
  const elem = createNewText(x, y, { isDefaultFont: true, isParamsLabel: true }) as SVGTextElement;

  renderParamsLabel(elem, { addToHistory: false, showMessage: false });
  selectionManager.selectOnly([elem]);
  undoManager.addCommandToHistory(new history.InsertElementCommand(elem));

  return elem;
};
