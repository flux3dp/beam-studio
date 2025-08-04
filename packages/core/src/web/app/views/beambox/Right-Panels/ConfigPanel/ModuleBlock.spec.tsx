import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

import ConfigPanelContext from './ConfigPanelContext';

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
}));

const mockUseWorkarea = jest.fn();

jest.mock('@core/helpers/hooks/useWorkarea', () => mockUseWorkarea);

const mockGetPresetsList = jest.fn();

jest.mock('@core/helpers/presets/preset-helper', () => ({
  getPresetsList: (...args) => mockGetPresetsList(...args),
}));

const mockTogglePresprayArea = jest.fn();

jest.mock('@core/app/actions/canvas/prespray-area', () => ({
  togglePresprayArea: (...args) => mockTogglePresprayArea(...args),
}));

const mockApplyPreset = jest.fn();
const mockWriteDataLayer = jest.fn();
const mockGetData = jest.fn().mockReturnValue('configName');

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  applyPreset: (...args) => mockApplyPreset(...args),
  baseConfig: {
    ink: 3,
    multipass: 3,
    printingSpeed: 60,
    speed: 20,
    strength: 15,
  },
  getData: (...args) => mockGetData(...args),
  moduleBaseConfig: {
    [LayerModule.PRINTER]: {
      multipass: 5,
    },
  },
  writeDataLayer: (...args) => mockWriteDataLayer(...args),
}));

const mockGetLayerElementByName = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getLayerElementByName: (...args) => mockGetLayerElementByName(...args),
}));

const mockToggleFullColorLayer = jest.fn();

jest.mock(
  '@core/helpers/layer/full-color/toggleFullColorLayer',
  () =>
    (...args) =>
      mockToggleFullColorLayer(...args),
);

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockUpdateLayerPanel = jest.fn();

jest.mock('@core/app/views/beambox/Right-Panels/contexts/LayerPanelController', () => ({
  updateLayerPanel: mockUpdateLayerPanel,
}));

let batchCmd = null;
const mockBatchCommand = jest.fn().mockImplementation(() => {
  batchCmd = { addSubCommand: jest.fn(), onAfter: null };

  return batchCmd;
});

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
}));

const mockAlertConfigRead = jest.fn();
const mockAlertConfigWrite = jest.fn();

jest.mock('@core/helpers/api/alert-config', () => ({
  read: (...args) => mockAlertConfigRead(...args),
  write: (...args) => mockAlertConfigWrite(...args),
}));

const mockInitState = jest.fn();

jest.mock('./initState', () => mockInitState);

const mockPreferenceRead = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: mockPreferenceRead,
}));

const mockUseDocumentStore = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: mockUseDocumentStore,
}));

import ModuleBlock from './ModuleBlock';

const mockUseConfigPanelStore = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

const mockSelectedLayers = ['layer1', 'layer2'];

describe('test ModuleBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkarea.mockReturnValue('ado1');
    mockAlertConfigRead.mockReturnValue(false);

    const mockToggleFullColorLayerCmd = { isEmpty: () => false };

    mockToggleFullColorLayer.mockReturnValue(mockToggleFullColorLayerCmd);

    mockUseConfigPanelStore.mockReturnValue({
      module: { hasMultiValue: false, value: LayerModule.LASER_10W_DIODE },
    });
  });

  it('should render correctly', () => {
    const { container } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(mockUseWorkarea).toHaveBeenCalledTimes(1);
  });

  it('should not render when workarea does not support module', () => {
    mockUseWorkarea.mockReturnValue('fpm1');

    const { container } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('change to 20w should work with preset change', () => {
    const { baseElement, getByText } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: ['layer1'] }}>
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    fireEvent.mouseDown(baseElement.querySelector('.ant-select-selector'));

    const mockElem = {};

    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockGetPresetsList
      .mockReturnValueOnce([{ name: 'config1', power: 88, repeat: 89, speed: 87 }])
      .mockReturnValueOnce([{ name: 'config1', power: 78, repeat: 79, speed: 77 }]);
    mockGetData.mockReturnValueOnce('config1');
    fireEvent.click(getByText('20W Diode Laser'));
    expect(mockGetData).toHaveBeenCalledTimes(2);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockElem, 'configName');
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change layer module');
    expect(mockGetLayerElementByName).toHaveBeenCalledTimes(1);
    expect(mockGetLayerElementByName).toHaveBeenNthCalledWith(1, 'layer1');
    expect(mockGetPresetsList).toHaveBeenCalledTimes(2);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(1, 'ado1', LayerModule.LASER_10W_DIODE);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(2, 'ado1', LayerModule.LASER_20W_DIODE);
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(1);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, mockElem, 'module', LayerModule.LASER_20W_DIODE, {
      batchCmd,
    });
    expect(mockApplyPreset).toHaveBeenCalledTimes(1);
    expect(mockApplyPreset).toHaveBeenNthCalledWith(
      1,
      mockElem,
      { name: 'config1', power: 78, repeat: 79, speed: 77 },
      { batchCmd },
    );
    expect(mockToggleFullColorLayer).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockElem, { val: false });
    expect(batchCmd.addSubCommand).toHaveBeenCalledTimes(1);
    expect(mockInitState).toHaveBeenCalledTimes(1);
    expect(mockInitState).toHaveBeenNthCalledWith(1, ['layer1']);
    expect(mockUpdateLayerPanel).toHaveBeenCalledTimes(1);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);
    expect(baseElement).toMatchSnapshot();

    batchCmd.onAfter();
    expect(mockInitState).toHaveBeenCalledTimes(2);
    expect(mockUpdateLayerPanel).toHaveBeenCalledTimes(2);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(2);
  });

  test('change to 20w should work without preset change', () => {
    const { baseElement, getByText } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: ['layer1'] }}>
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    fireEvent.mouseDown(baseElement.querySelector('.ant-select-selector'));

    const mockElem = {};

    mockGetLayerElementByName.mockReturnValue(mockElem);

    const mockPresetList = [{ name: 'config1', power: 88, repeat: 89, speed: 87 }];

    mockGetPresetsList.mockReturnValue(mockPresetList);
    mockGetData.mockReturnValueOnce('config1');
    fireEvent.click(getByText('20W Diode Laser'));
    expect(mockGetData).toHaveBeenCalledTimes(2);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockElem, 'configName');
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change layer module');
    expect(mockGetLayerElementByName).toHaveBeenCalledTimes(1);
    expect(mockGetLayerElementByName).toHaveBeenNthCalledWith(1, 'layer1');
    expect(mockGetPresetsList).toHaveBeenCalledTimes(2);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(1, 'ado1', LayerModule.LASER_10W_DIODE);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(2, 'ado1', LayerModule.LASER_20W_DIODE);
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(1);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, mockElem, 'module', LayerModule.LASER_20W_DIODE, {
      batchCmd,
    });
    expect(mockApplyPreset).not.toHaveBeenCalled();
    expect(mockToggleFullColorLayer).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockElem, { val: false });
    expect(batchCmd.addSubCommand).toHaveBeenCalledTimes(1);
    expect(mockInitState).toHaveBeenCalledTimes(1);
    expect(mockInitState).toHaveBeenNthCalledWith(1, ['layer1']);
    expect(mockUpdateLayerPanel).toHaveBeenCalledTimes(1);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);

    batchCmd.onAfter();
    expect(mockInitState).toHaveBeenCalledTimes(2);
    expect(mockUpdateLayerPanel).toHaveBeenCalledTimes(2);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(2);
  });

  test('change to 20w should work without corresponding config', () => {
    const { baseElement, getByText } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: ['layer1'] }}>
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    fireEvent.mouseDown(baseElement.querySelector('.ant-select-selector'));

    const mockElem = {};

    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockGetPresetsList
      .mockReturnValueOnce([{ name: 'config1', power: 88, repeat: 89, speed: 87 }])
      .mockReturnValueOnce([]);
    mockGetData.mockReturnValueOnce('config1');
    fireEvent.click(getByText('20W Diode Laser'));
    expect(mockGetData).toHaveBeenCalledTimes(2);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockElem, 'configName');
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change layer module');
    expect(mockGetLayerElementByName).toHaveBeenCalledTimes(1);
    expect(mockGetLayerElementByName).toHaveBeenNthCalledWith(1, 'layer1');
    expect(mockGetPresetsList).toHaveBeenCalledTimes(2);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(1, 'ado1', LayerModule.LASER_10W_DIODE);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(2, 'ado1', LayerModule.LASER_20W_DIODE);
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(2);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, mockElem, 'module', LayerModule.LASER_20W_DIODE, {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, mockElem, 'configName', undefined, {
      batchCmd,
    });
    expect(mockApplyPreset).not.toHaveBeenCalled();
    expect(mockToggleFullColorLayer).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockElem, { val: false });
    expect(batchCmd.addSubCommand).toHaveBeenCalledTimes(1);
    expect(mockInitState).toHaveBeenCalledTimes(1);
    expect(mockInitState).toHaveBeenNthCalledWith(1, ['layer1']);
    expect(mockUpdateLayerPanel).toHaveBeenCalledTimes(1);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);

    batchCmd.onAfter();
    expect(mockInitState).toHaveBeenCalledTimes(2);
    expect(mockUpdateLayerPanel).toHaveBeenCalledTimes(2);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(2);
  });

  test('change to printer should work when selecting 2 layer', async () => {
    const { baseElement, getByText } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    fireEvent.mouseDown(baseElement.querySelector('.ant-select-selector'));

    const mockElem1 = { name: 'layer1' };
    const mockElem2 = { name: 'layer2' };

    mockGetLayerElementByName.mockReturnValueOnce(mockElem1).mockReturnValue(mockElem2);
    mockGetPresetsList.mockReturnValueOnce([]);
    fireEvent.click(getByText('Printing'));
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    await mockPopUp.mock.calls[0][0].onConfirm();
    expect(mockGetLayerElementByName).toHaveBeenCalledTimes(2);
    expect(mockGetLayerElementByName).toHaveBeenNthCalledWith(1, 'layer1');
    expect(mockGetLayerElementByName).toHaveBeenNthCalledWith(2, 'layer2');
    expect(mockGetData).toHaveBeenCalledTimes(4);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockElem1, 'configName');
    expect(mockGetData).toHaveBeenNthCalledWith(3, mockElem2, 'configName');
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change layer module');
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, mockElem1, 'module', LayerModule.PRINTER, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, mockElem1, 'configName', undefined, {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(3, mockElem1, 'printingSpeed', 60, {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(4, mockElem1, 'ink', 3, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(5, mockElem1, 'multipass', 5, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(6, mockElem2, 'module', LayerModule.PRINTER, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(7, mockElem2, 'configName', undefined, {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(8, mockElem2, 'printingSpeed', 60, {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(9, mockElem2, 'ink', 3, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(10, mockElem2, 'multipass', 5, { batchCmd });
    expect(mockToggleFullColorLayer).toHaveBeenCalledTimes(2);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockElem1, { val: true });
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(2, mockElem2, { val: true });
    expect(batchCmd.addSubCommand).toHaveBeenCalledTimes(2);
    expect(mockInitState).toHaveBeenCalledTimes(1);
    expect(mockInitState).toHaveBeenNthCalledWith(1, ['layer1', 'layer2']);
    expect(mockUpdateLayerPanel).toHaveBeenCalledTimes(1);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);
    expect(baseElement).toMatchSnapshot();

    batchCmd.onAfter();
    expect(mockInitState).toHaveBeenCalledTimes(2);
    expect(mockUpdateLayerPanel).toHaveBeenCalledTimes(2);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(2);
  });
});
