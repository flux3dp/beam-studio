import { ContextHelper } from '../Layer-Panel';

const updateLayerPanel = (): void => {
  if (!ContextHelper.context) {
    // console.log('LayerPanel is not mounted now.');
  } else {
    ContextHelper.context.updateLayerPanel();
  }
};

const getSelectedLayers = (): string[] => {
  if (!ContextHelper.context) {
    // console.info('LayerPanel is not mounted now.');
    return null;
  }
  return ContextHelper.context.selectedLayers;
};

const setSelectedLayers = (selectedLayers: string[]): void => {
  if (!ContextHelper.context) {
    // console.info('LayerPanel is not mounted now.');
  } else {
    ContextHelper.context.setSelectedLayers(selectedLayers);
  }
};

export default {
  updateLayerPanel,
  getSelectedLayers,
  setSelectedLayers,
};
