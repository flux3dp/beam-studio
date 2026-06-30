import changeAttribute from '@core/app/svgedit/history/changeAttribute';
import { handleHistoryActionOptions } from '@core/app/svgedit/history/utils/handleHistoryActionOptions';
import type { HistoryActionOptions } from '@core/interfaces/IHistory';

const attrName = {
  backup: 'data-opacity-backup',
  config: 'data-opacity', // defined in layer-config-helper attributeMap, hardcode here to avoid circular dependency
  ratio: 'data-opacity-ratio',
};

export const getLayerOpacityRatio = (layer: SVGGElement): number => {
  const opacity = layer.getAttribute(attrName.ratio);

  if (opacity === null || opacity === undefined) return 1;

  return Number.parseFloat(opacity);
};

export const setLayerOpacityRatio = (layer: SVGGElement, ratio: number, opts?: HistoryActionOptions): void => {
  handleHistoryActionOptions(changeAttribute(layer, { [attrName.ratio]: String(ratio) }), opts);
};

export const setTemporaryOpacity = (layer: SVGGElement, opacity: string, opts?: HistoryActionOptions): void => {
  handleHistoryActionOptions(
    changeAttribute(layer, {
      [attrName.backup]: layer.getAttribute(attrName.config),
      [attrName.config]: opacity,
    }),
    opts,
  );
};

export const revertBackupOpacity = (layer: SVGGElement, opts?: HistoryActionOptions): void => {
  const backupValue = layer.getAttribute(attrName.backup);

  if (backupValue === null) return;

  handleHistoryActionOptions(
    changeAttribute(layer, {
      [attrName.backup]: null,
      [attrName.config]: backupValue,
    }),
    opts,
  );
};

export const removeBackupOpacity = (layer: SVGGElement, opts?: HistoryActionOptions): void => {
  handleHistoryActionOptions(changeAttribute(layer, { [attrName.backup]: null }), opts);
};

export const updateLayerOpacity = (layer: SVGGElement, opts?: HistoryActionOptions): void => {
  const configValue = Number(layer.getAttribute(attrName.config) || 100);
  const ratio = getLayerOpacityRatio(layer);
  const opacity = String((ratio * configValue) / 100);

  handleHistoryActionOptions(changeAttribute(layer, { opacity }), opts);
};
