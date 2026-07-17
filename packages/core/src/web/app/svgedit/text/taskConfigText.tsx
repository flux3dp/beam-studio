import React, { useMemo, useState } from 'react';

import { Button, Checkbox, Col, Divider, Modal, Row } from 'antd';
import { match } from 'ts-pattern';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { laserModules, LayerModule, UVModules } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { getStorage, setStorage, useStorageStore } from '@core/app/stores/storageStore';
import { attributeMap, getConfigKeys, getData, objectConfig } from '@core/helpers/layer/layer-config-helper';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { ConfigKey } from '@core/interfaces/ILayerConfig';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import history from '../history/history';
import undoManager from '../history/undoManager';
import selectionManager from '../selection';
import { getBBox } from '../utils/getBBox';

import { renderText } from './textedit/renderText';
import { textContentEvents } from './textedit/setters';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const configKeysAttr = 'data-config-keys';

/** Not a layer config, rendered as the title line of the text */
export const layerNameKey = 'layerName';

export type TaskConfigKey = ConfigKey | typeof layerNameKey;

// Keys whose values are not human readable in a text object
const hiddenKeys = new Set<ConfigKey>(['clipRect', 'color', ...objectConfig]);

export const allConfigKeys: TaskConfigKey[] = [
  layerNameKey,
  ...(Object.keys(attributeMap) as ConfigKey[]).filter((key) => !hiddenKeys.has(key)).sort(),
];

/**
 * Config keys saved as the default for layer config texts, null when unset or unusable.
 */
export const getStorageConfigKeys = (): null | TaskConfigKey[] => {
  const stored = getStorage('default-layer-config-keys');

  // Storage may hold anything, e.g. a leftover value that failed to parse back into an array
  if (!Array.isArray(stored)) return null;

  return stored as TaskConfigKey[];
};

export const setStorageConfigKeys = (keys: TaskConfigKey[]): void => {
  setStorage('default-layer-config-keys', keys);
};

/**
 * Config keys to display on a layer config text, falls back to the saved default and then to all
 * keys when the text has no keys of its own.
 */
export const getSelectedConfigKeys = (elem: SVGTextElement): TaskConfigKey[] => {
  const attr = elem.getAttribute(configKeysAttr);

  if (attr === null) return getStorageConfigKeys() ?? [...allConfigKeys];

  const selected = new Set(attr.split(','));

  return allConfigKeys.filter((key) => selected.has(key));
};

export const setSelectedConfigKeys = (elem: SVGTextElement, keys: TaskConfigKey[]): void => {
  // 'none' instead of '' because history commands treat an empty attribute as a removed one,
  // and a missing attribute means every key is selected
  elem.setAttribute(configKeysAttr, keys.length ? keys.join(',') : 'none');
};

/**
 * Set the displayed config keys and record it in undo history. The text content itself is derived
 * from the keys, so undo/redo only restores the attribute and re-renders from it.
 */
export const writeSelectedConfigKeys = (elem: SVGTextElement, keys: TaskConfigKey[]): void => {
  const oldValue = elem.getAttribute(configKeysAttr);

  setSelectedConfigKeys(elem, keys);

  if (elem.getAttribute(configKeysAttr) !== oldValue) {
    const cmd = new history.ChangeElementCommand(elem, { [configKeysAttr]: oldValue }, 'layer config keys');

    cmd.onAfter = () => renderLayerConfigText(elem);
    undoManager.addCommandToHistory(cmd);
  }

  renderLayerConfigText(elem);
};

/** Units shown after config values, keys without a unit are omitted. Always metric, en only. */
export const configUnitMap: Partial<Record<TaskConfigKey, string>> = {
  accX: 'mm/s²',
  accY: 'mm/s²',
  airAssist: '%',
  backlash: 'mm',
  dottingTime: 'us',
  fillAngle: 'deg',
  fillInterval: 'mm',
  focus: 'mm',
  focusStep: 'mm',
  frequency: 'kHz',
  height: 'mm',
  minPadding: 'mm',
  minPower: '%',
  multipass: 'times',
  nozzleOffsetX: 'mm',
  nozzleOffsetY: 'mm',
  power: '%',
  printingSpeed: 'mm/s',
  printingStrength: '%',
  pulseWidth: 'ns',
  refreshInterval: 'sec',
  repeat: 'times',
  rightPadding: 'mm',
  scA0: 'mm/s²',
  scAMax: 'mm/s²',
  scJerk: 'mm/s³',
  speed: 'mm/s',
  travelSpeed: 'mm/s',
  uvCuringRepeat: 'times',
  uvPrintingRepeat: 'times',
  uvStrength: '%',
  wMultipass: 'times',
  wobbleDiameter: 'mm',
  wobbleStep: 'mm',
  wRepeat: 'times',
  wSpeed: 'mm/s',
  zStep: 'mm',
};

/**
 * Config keys worth showing for the layer the text sits on, mirrors the blocks ConfigPanel renders
 * for the current workarea and layer module.
 */
export const getRecommendedConfigKeys = (elem: SVGTextElement): TaskConfigKey[] => {
  const workarea = useDocumentStore.getState().workarea;
  const module = getData(getObjectLayer(elem)?.elem, 'module') ?? LayerModule.LASER_UNIVERSAL;
  const keys: TaskConfigKey[] = [layerNameKey, ...getConfigKeys(module)];

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

  return allConfigKeys.filter((key) => keys.includes(key));
};

const getLayerConfigs = (keys: TaskConfigKey[], layer?: SVGGElement, title?: string) => {
  if (!layer) return { configs: ['Layer Config Placeholder'], noColumnOnFirstLine: true };

  const showTitle = keys.includes(layerNameKey) && !!title;
  const configs = showTitle ? [title, '', ''] : [];

  keys.forEach((key) => {
    if (key === layerNameKey) return;

    const value = getData(layer, key);

    if (value === undefined) return;

    const unit = configUnitMap[key];

    configs.push(`${key}: ${value}${unit ? ` ${unit}` : ''}  `);
  });

  return { configs, noColumnOnFirstLine: showTitle };
};

export const renderLayerConfigText = (elem: SVGTextElement): void => {
  // Find layer
  const layer = getObjectLayer(elem);
  // Generate layer config text
  const configText = getLayerConfigs(getSelectedConfigKeys(elem), layer?.elem, layer?.title);
  // Record elem size
  const bbox = getBBox(elem);

  // Render text
  renderText(elem, configText.configs.join('\u0085'));

  const columnCount = 3;
  const maxWidth = Array(3).fill(0);
  const tspans = Array.from(elem.querySelectorAll('tspan'));
  let yStart = 0;
  let yOffset = 0;
  const xOffsets: number[] = [];

  tspans.forEach((tspan, index) => {
    const columnIndex = index % columnCount;
    const tspanBBox = getBBox(tspan);

    if (index === 0) {
      const x = Number.parseFloat(tspan.getAttribute('x') || '0');
      const y = Number.parseFloat(tspan.getAttribute('y') || '0');

      xOffsets.push(x);
      yStart = y;
    } else if (index === 1) {
      const y = Number.parseFloat(tspan.getAttribute('y') || '0');

      yOffset = y - yStart;
    }

    if (configText.noColumnOnFirstLine && index < columnCount) return;

    if (tspanBBox.width > maxWidth[columnIndex]) {
      maxWidth[columnIndex] = tspanBBox.width;
    }
  });

  maxWidth.forEach((width, index) => {
    if (index > 0) {
      xOffsets[index] = xOffsets[index - 1] + maxWidth[index - 1];
    }
  });
  tspans.forEach((tspan, index) => {
    const columnIndex = index % columnCount;
    const rowIndex = Math.floor(index / columnCount);

    tspan.setAttribute('x', `${xOffsets[columnIndex]}`);
    tspan.setAttribute('y', `${yStart + yOffset * rowIndex}`);
  });

  // Resize elem, setSvgElemSize works on the selected element, restore selection afterwards
  // because this also runs on undo / redo and before exporting
  const selected = selectionManager.getSelectedElements();

  selectionManager.selectOnly([elem]);
  svgCanvas.setSvgElemSize('width', bbox.width, false);
  svgCanvas.setSvgElemSize('height', bbox.height, false);

  if (selected.length && !(selected.length === 1 && selected[0] === elem)) {
    selectionManager.selectOnly(selected, true);
  }

  textContentEvents.emit('changed');
};

export const applyAllTaskConfigTexts = (): void => {
  const layerConfigTextElems = Array.from(
    document.querySelectorAll('text[data-layer-config="true"]'),
  ) as SVGTextElement[];

  layerConfigTextElems.forEach((elem) => {
    renderLayerConfigText(elem);
  });
};

interface LayerConfigSettingsProps {
  elem: SVGTextElement;
  onClose: () => void;
}

const LayerConfigSettings = ({ elem, onClose }: LayerConfigSettingsProps): React.JSX.Element => {
  const [keys, setKeys] = useState<TaskConfigKey[]>(() => getSelectedConfigKeys(elem));
  const checkedAll = keys.length === allConfigKeys.length;
  // Subscribe so 'Use Storage Value' reflects the value right after saving it
  const storedKeys = useStorageStore((state) => state['default-layer-config-keys']);
  const storageKeys = useMemo(() => getStorageConfigKeys(), [storedKeys]);

  return (
    <Modal
      cancelText="Close"
      centered
      footer={(_, { CancelBtn, OkBtn }) => (
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <Button onClick={() => setStorageConfigKeys(keys)} style={{ marginRight: 'auto' }}>
            Save to Storage
          </Button>
          <CancelBtn />
          <OkBtn />
        </div>
      )}
      okText="Apply"
      onCancel={onClose}
      onOk={() => {
        writeSelectedConfigKeys(elem, keys);
        onClose();
      }}
      open
      title="Layer Config Settings"
      width={640}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
        <Checkbox
          checked={checkedAll}
          indeterminate={keys.length > 0 && !checkedAll}
          onChange={({ target }) => setKeys(target.checked ? [...allConfigKeys] : [])}
        >
          Check All
        </Checkbox>
        <Button onClick={() => setKeys(getRecommendedConfigKeys(elem))}>Use Recommended</Button>
        <Button disabled={!storageKeys} onClick={() => setKeys(storageKeys!)}>
          Use Storage Value
        </Button>
      </div>
      <Divider />
      <Checkbox.Group onChange={(value) => setKeys(value as ConfigKey[])} value={keys}>
        <Row gutter={[8, 8]}>
          {allConfigKeys.map((key) => (
            <Col key={key} span={8}>
              <Checkbox value={key}>{key === layerNameKey ? 'Layer Name' : key}</Checkbox>
            </Col>
          ))}
        </Row>
      </Checkbox.Group>
    </Modal>
  );
};

export const showLayerConfigSettings = (elem: SVGTextElement): void => {
  const id = `layer-config-settings-${elem.id}`;

  if (isIdExist(id)) return;

  addDialogComponent(id, <LayerConfigSettings elem={elem} onClose={() => popDialogById(id)} />);
};
