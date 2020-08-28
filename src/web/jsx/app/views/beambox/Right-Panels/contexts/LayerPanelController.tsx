define(['jsx!views/beambox/Right-Panels/Layer-Panel'], function (LayerPanel) {
  const React = require('react');

  updateLayerPanel = () => {
    if (!LayerPanel.contextCaller) {//console.log('LayerPanel is not mounted now.');
    } else {
      LayerPanel.contextCaller.updateLayerPanel();
    }
  };

  return {
    updateLayerPanel: updateLayerPanel
  };
});