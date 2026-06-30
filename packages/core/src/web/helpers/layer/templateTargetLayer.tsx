import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import TemplateTargetSettingModal from '@core/app/components/dialogs/TemplateTargetSettingModal';
import alertConstants from '@core/app/constants/alert-constants';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { skippedModules } from '@core/app/constants/layer-module/layer-modules';
import layerManager from '@core/app/svgedit/layer/layerManager';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { mockT } from '@core/helpers/is-dev';
import { getData } from '@core/helpers/layer/layer-config-helper';

const attributeName = 'data-template-target';

export const templateEventEmitter = eventEmitterFactory.createEventEmitter('template');

export type TemplateTargetLayer = {
  label: null | string;
  layerG: SVGGElement;
  value: string;
};

const getTargetLayers = (): TemplateTargetLayer[] => {
  return layerManager
    .getAllLayers()
    .filter((layer) => !skippedModules.has(getData(layer.getGroup(), 'module') as LayerModuleType))
    .map((layer) => ({
      label: layer.getGroup().getAttribute(attributeName),
      layerG: layer.getGroup(),
      value: layer.getName(),
    }));
};

export const isImportable = (layers = getTargetLayers()) => layers.some((layer) => layer.label);

const setTargetLayers = (newConfig: TemplateTargetLayer[]) => {
  newConfig.forEach(({ label, layerG }) => {
    if (label) layerG.setAttribute(attributeName, label);
    else layerG.removeAttribute(attributeName);
  });
};

export const askToEditTargetLayers = () => {
  const modelId = 'template-target-layer-editor';
  const layers = getTargetLayers();
  const hasTargetLayer = isImportable(layers);

  let message = mockT('Do you want to edit the current template target layers?');

  if (!hasTargetLayer) {
    message = `${message}\n${mockT('No template target layer found. Your customer will be unable to add new elements into this template.')}`;
  }

  return new Promise<void>((resolve) =>
    alertCaller.popUp({
      buttonType: alertConstants.YES_NO,
      caption: mockT('Setup Template Target Layers'),
      message,
      onNo: resolve,
      onYes: async () => {
        const newLayerConfigs = await new Promise<null | TemplateTargetLayer[]>((resolveConfig) => {
          dialogCaller.addDialogComponent(
            modelId,
            <TemplateTargetSettingModal
              layers={layers}
              onClose={() => dialogCaller.popDialogById(modelId)}
              resolve={resolveConfig}
            />,
          );
        });

        if (newLayerConfigs) {
          setTargetLayers(newLayerConfigs);
        }

        resolve();
      },
    }),
  );
};

export const determineTargetLayer = async (): Promise<null | string> => {
  const modelId = 'template-target-layer';
  const options = getTargetLayers().filter((layer) => layer.label) as Array<{ label: string; value: string }>;

  if (options.length === 0) {
    throw new Error('No template target layers');
  }

  if (options.length === 1) {
    return options[0].value;
  }

  return dialogCaller.showRadioSelectDialog({
    id: modelId,
    options,
    title: mockT('Select Target Layer'),
  });
};
