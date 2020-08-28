define(['app/actions/beambox/constant', 'jsx!views/beambox/Right-Panels/Object-Panel'], function (Constant, ObjectPanel) {
  const React = require('react');

  updateDimensionValues = newValue => {
    if (!ObjectPanel.contextCaller) {//console.log('ObjectPanel is not mounted now.');
    } else {
      ObjectPanel.contextCaller.updateDimensionValues(newValue);
    }
  };

  getDimensionValues = key => {
    if (!ObjectPanel.contextCaller) {//console.log('ObjectPanel is not mounted now.');
    } else {
      return ObjectPanel.contextCaller.getDimensionValues(key);
    }
  };

  updateObjectPanel = () => {
    if (!ObjectPanel.contextCaller) {//console.log('ObjectPanel is not mounted now.');
    } else {
      ObjectPanel.contextCaller.updateObjectPanel();
    }
  };

  return {
    updateObjectPanel: updateObjectPanel,
    updateDimensionValues: updateDimensionValues,
    getDimensionValues: getDimensionValues
  };
});