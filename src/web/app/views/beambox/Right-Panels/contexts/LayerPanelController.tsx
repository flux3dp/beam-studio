import { ContextHelper } from '../Layer-Panel';
const updateLayerPanel = () => {
    if (!ContextHelper.context) {
        //console.log('LayerPanel is not mounted now.');
    } else {
        ContextHelper.context.updateLayerPanel();
    }
};

const getSelectedLayers = () => {
    if (!ContextHelper.context) {
        // console.info('LayerPanel is not mounted now.');
        return null;
    } else {
        return ContextHelper.context.selectedLayers;
    }
}

const setSelectedLayers = (selectedLayers: string[]) => {
    if (!ContextHelper.context) {
        // console.info('LayerPanel is not mounted now.');
    } else {
        ContextHelper.context.setSelectedLayers(selectedLayers);
    }
}

export default {
    updateLayerPanel,
    getSelectedLayers,
    setSelectedLayers,
};
