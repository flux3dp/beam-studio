import { ContextHelper } from '../Layer-Panel';
const updateLayerPanel = () => {
    if (!ContextHelper.context) {
        //console.log('LayerPanel is not mounted now.');
    } else {
        ContextHelper.context.updateLayerPanel();
    }
};

export default {
    updateLayerPanel
};
