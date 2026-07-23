import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import TemplateTargetSettingModal from '@core/app/components/dialogs/TemplateTargetSettingModal';
import alertConstants from '@core/app/constants/alert-constants';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { skippedModules } from '@core/app/constants/layer-module/layer-modules';
import layerManager from '@core/app/svgedit/layer/layerManager';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
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
  const t = i18n.lang.template_target_layer_setting;

  let message = t.ask_to_edit;

  if (!hasTargetLayer) {
    message = `${message}\n${t.no_target_layer_found}`;
  }

  return new Promise<void>((resolve) =>
    alertCaller.popUp({
      buttonType: alertConstants.YES_NO,
      caption: t.ask_to_edit_title,
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
    title: i18n.lang.template_target_layer_setting.select_target_layer,
  });
};
