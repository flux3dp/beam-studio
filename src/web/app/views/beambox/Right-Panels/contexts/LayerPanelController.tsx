import { LayerPanel, LayerPanelContextCaller } from '../Layer-Panel';
const React = requireNode('react');
const updateLayerPanel = () => {
    if (!LayerPanelContextCaller) {
        //console.log('LayerPanel is not mounted now.');
    } else {
        LayerPanelContextCaller.updateLayerPanel();
    }
};

export default {
    updateLayerPanel
};
